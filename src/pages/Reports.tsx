import { useMemo } from 'react';
import { useStoreData } from '../hooks/useStoreData';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Reports() {
  const { sales, products, loading } = useStoreData();

  const salesData = useMemo(() => {
    // Group sales by day for the chart (excluding PROFORMAS)
    const realSales = sales.filter(s => s.documentType !== 'PROFORMA');
    const grouped = realSales.reduce((acc, sale) => {
      const date = format(new Date(sale.date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += sale.total;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; total: number; count: number }>);

    const values = Object.values(grouped) as { date: string; total: number; count: number }[];
    return values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales]);

  const stockData = useMemo(() => {
    return products.slice(0, 10).map(p => ({
      name: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
      stock: p.stock
    }));
  }, [products]);

  if (loading) return <div className="text-zinc-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      {/* <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-zinc-900/50 shadow-lg rounded-xl border border-zinc-800 p-5">
          <h3 className="text-sm uppercase font-bold text-zinc-400 mb-4 tracking-wider">Daily Sales Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Chart */}
        <div className="bg-zinc-900/50 shadow-lg rounded-xl border border-zinc-800 p-5">
          <h3 className="text-sm uppercase font-bold text-zinc-400 mb-4 tracking-wider">Stock Levels (Top 10)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" />
                <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="stock" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-zinc-900/50 shadow-lg rounded-xl border border-zinc-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-semibold text-zinc-200">Sales History Database</h3>
          <button className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 transition-colors">Export List</button>
        </div>
        <div className="flex-1 overflow-x-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase">
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sales.filter(s => s.documentType !== 'PROFORMA').slice().reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-cyan-400">{sale.invoiceNumber}</td>
                  <td className="px-4 py-3 text-zinc-500">{format(sale.date, 'MMM dd, yyyy h:mm a')}</td>
                  <td className="px-4 py-3 text-zinc-300">{sale.customerName || '-'}</td>
                  <td className="px-4 py-3 text-zinc-300">{sale.items.length}</td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-200">{formatCurrency(sale.total)}</td>
                </tr>
              ))}
              {sales.filter(s => s.documentType !== 'PROFORMA').length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-500">No sales recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
