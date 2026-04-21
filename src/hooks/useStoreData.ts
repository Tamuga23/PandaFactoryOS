import { useState, useEffect, useMemo } from 'react';
import { db, auth, handleFirestoreError } from '../lib/db';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Product, Sale, DashboardStats } from '../types';

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
      const batch = writeBatch(db);
      
      const fullSale = { ...sale, ownerId: user.uid, status: sale.status || 'completed' };
      batch.set(doc(db, 'sales', sale.id), fullSale);

      // Deduct stock safely
      sale.items.forEach(item => {
        const productRef = doc(db, 'products', item.id);
        const p = products.find(prod => prod.id === item.id);
        if (p) {
          batch.update(productRef, {
            stock: p.stock - item.quantity,
            updatedAt: Date.now()
          });
        }
      });

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, 'create', `sales/${sale.id}`);
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

  const stats: DashboardStats = useMemo(() => ({
    totalProducts: products.length,
    totalStockValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0),
    lowStockItems: products.filter(p => p.stock <= p.minStockAlert),
    recentSales: [...sales].sort((a, b) => b.date - a.date).slice(0, 5),
    totalSalesValue: sales.reduce((acc, s) => acc + (s.status === 'completed' ? s.total : 0), 0),
  }), [products, sales]);

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
