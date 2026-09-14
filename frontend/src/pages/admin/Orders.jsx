import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';

export default function AdminOrders() {
  const [filters, setFilters] = useState({ search: '', status: '', paymentStatus: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, filters],
    queryFn: async () => (await api.get('/orders', { params: { page, limit: 25, ...stripEmpty(filters) } })).data.data,
  });

  return (
    <>
      <Seo title="Orders" noindex />
      <PageHeader title="Orders" subtitle={`${data?.total ?? 0} total`} />

      <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="input md:col-span-2" placeholder="Search by user ID/email/site/order#" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {['pending', 'approved', 'in_progress', 'delivered', 'rejected', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input" value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}>
          <option value="">All payments</option>
          {['pending', 'paid', 'refunded', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['Order #', 'Buyer', 'Site', 'Type', 'Amount', 'Payment', 'Status', 'Ordered', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={9}>Loading…</td></tr>
            ) : data?.items?.length ? data.items.map((o) => (
              <tr key={o.id}>
                <td className="td font-mono text-xs">{o.orderNumber}</td>
                <td className="td">
                  <div className="font-medium">{o.buyer?.email}</div>
                  <div className="text-xs text-slate-400">{o.buyer?.publicId}</div>
                </td>
                <td className="td">{o.orderedSite}</td>
                <td className="td capitalize text-xs">{o.orderType?.replace('_', ' ')}</td>
                <td className="td">{money(o.amount)}</td>
                <td className="td"><StatusBadge status={o.paymentStatus} /></td>
                <td className="td"><StatusBadge status={o.status} /></td>
                <td className="td text-xs">{dateTime(o.createdAt)}</td>
                <td className="td"><Link to={`/admin/orders/${o.id}`} className="text-brand-600 font-medium">Open</Link></td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={9}>No orders.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > data.limit && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-50">Prev</button>
          <span className="text-sm self-center text-slate-500">Page {page}</span>
          <button disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </>
  );
}

const stripEmpty = (o) => Object.fromEntries(Object.entries(o).filter(([_, v]) => v !== '' && v != null));
