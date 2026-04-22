import { useState, useEffect, useMemo } from 'react';
import { db, auth, handleFirestoreError } from '../lib/db';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, deleteDoc, writeBatch, runTransaction, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Product, Sale, Purchase, CompanyInfo, DashboardStats } from '../types';

export function useStoreData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProducts([]);
        setSales([]);
        setPurchases([]);
        setCompanyInfo(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const qProducts = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prodData = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
      setProducts(prodData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, 'list', 'products'));

    const qSales = query(collection(db, 'sales'), where('ownerId', '==', user.uid));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const saleData = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Sale));
      setSales(saleData);
    }, (error) => handleFirestoreError(error, 'list', 'sales'));

    const qPurchases = query(collection(db, 'purchases'), where('ownerId', '==', user.uid));
    const unsubPurchases = onSnapshot(qPurchases, (snapshot) => {
      const purchaseData = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Purchase));
      setPurchases(purchaseData);
    }, (error) => handleFirestoreError(error, 'list', 'purchases'));

    const qCompany = query(collection(db, 'company'), where('ownerId', '==', user.uid));
    const unsubCompany = onSnapshot(qCompany, (snapshot) => {
      if (!snapshot.empty) {
        setCompanyInfo({ ...snapshot.docs[0].data() } as CompanyInfo);
      } else {
        setCompanyInfo(null);
      }
    }, (error) => handleFirestoreError(error, 'list', 'company'));

    return () => {
      unsubProducts();
      unsubSales();
      unsubPurchases();
      unsubCompany();
    };
  }, [user]);

  const updateCompanyInfo = async (info: Omit<CompanyInfo, 'ownerId'>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'company', user.uid), { ...info, ownerId: user.uid });
    } catch (e) {
      handleFirestoreError(e, 'write', `company/${user.uid}`);
    }
  };

  const addProduct = async (product: Omit<Product, 'ownerId'>) => {
    if (!user) return;
    try {
      const fullProduct = { ...product, ownerId: user.uid };
      await setDoc(doc(db, 'products', product.id), fullProduct);
    } catch (e) {
      handleFirestoreError(e, 'create', `products/${product.id}`);
    }
  };

  const updateProduct = async (product: Product) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'products', product.id), {
        ...product,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, 'update', `products/${product.id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, 'delete', `products/${id}`);
    }
  };
  
  const updateSale = async (sale: Sale) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'sales', sale.id), { ...sale });
    } catch (e) {
      handleFirestoreError(e, 'update', `sales/${sale.id}`);
    }
  };

  const deleteSale = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'sales', id));
    } catch (e) {
      handleFirestoreError(e, 'delete', `sales/${id}`);
    }
  };

  const recordSale = async (sale: Omit<Sale, 'ownerId'>) => {
    if (!user) return;
    try {
      const fullSale = { ...sale, ownerId: user.uid, status: sale.status || 'completed' };
      const saleRef = doc(db, 'sales', sale.id);

      // Pilar 3: Transacción atómica
      await runTransaction(db, async (transaction) => {
        const productRefs = sale.items.map(item => ({
          ref: doc(db, 'products', item.id),
          item
        }));

        // 1. Read all required documents first (Requirement of Firestore transactions)
        const productDocs = await Promise.all(productRefs.map(pr => transaction.get(pr.ref)));

        // 2. Perform validations (skip stock check for PROFORMA)
        productDocs.forEach((pDoc, index) => {
          if (!pDoc.exists()) {
            throw new Error(`Product ${productRefs[index].item.name} does not exist in DB.`);
          }
          const productData = pDoc.data() as Product;
          if (sale.documentType !== 'PROFORMA' && productData.stock < productRefs[index].item.quantity) {
             throw new Error(`Insufficient stock for ${productData.name}. Requested: ${productRefs[index].item.quantity}, Available: ${productData.stock}`);
          }
        });

        // 3. Perform all writes
        productDocs.forEach((pDoc, index) => {
          if (sale.documentType !== 'PROFORMA') {
            const productData = pDoc.data() as Product;
            const newStock = productData.stock - productRefs[index].item.quantity;
            transaction.update(productRefs[index].ref, {
               stock: newStock,
               updatedAt: Date.now()
            });
          }
        });

        transaction.set(saleRef, fullSale);
      });

    } catch (e) {
      console.error("Transaction failed: ", e);
      handleFirestoreError(e, 'create', `sales/${sale.id}`);
      throw e; // Rethrow allowing the UI to handle it if needed
    }
  };

  const recordPurchase = async (purchase: Omit<Purchase, 'ownerId'>) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const fullPurchase = { ...purchase, ownerId: user.uid };
      batch.set(doc(db, 'purchases', purchase.id), fullPurchase);

      // Increase stock
      purchase.items.forEach(item => {
        const productRef = doc(db, 'products', item.id);
        const p = products.find(prod => prod.id === item.id);
        if (p) {
          batch.update(productRef, {
            stock: p.stock + item.quantity,
            updatedAt: Date.now()
          });
        }
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, 'create', `purchases/${purchase.id}`);
    }
  };

  const deletePurchase = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'purchases', id));
    } catch (e) {
      handleFirestoreError(e, 'delete', `purchases/${id}`);
    }
  };

  const stats: DashboardStats = useMemo(() => {
    const realSales = sales.filter(s => s.documentType !== 'PROFORMA');
    return {
      totalProducts: products.length,
      totalStockValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0),
      lowStockItems: products.filter(p => p.stock <= p.minStockAlert && !p.isReordering),
      recentSales: [...realSales].sort((a, b) => b.date - a.date).slice(0, 5),
      totalSalesValue: realSales.reduce((acc, s) => acc + (s.status === 'completed' ? s.total : 0), 0),
    };
  }, [products, sales]);

  return {
    user,
    products,
    sales,
    purchases,
    companyInfo,
    loading,
    stats,
    addProduct,
    updateProduct,
    deleteProduct,
    recordSale,
    updateSale,
    deleteSale,
    recordPurchase,
    deletePurchase,
    updateCompanyInfo,
    refreshMetrics: () => {}
  };
}
