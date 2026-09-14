import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Seo from '@/components/Seo';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';

export default function BuyerOrders() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', status],
    queryFn: async () => (await api.get('/orders/me', { params: { status: status || undefined, limit: 50 } })).data.data,
  });

  return (
    <>
      <Seo title="My orders" noindex />
      <PageHeader title="My orders" subtitle={`${data?.total ?? 0} total`} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'approved', 'in_progress', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`badge cursor-pointer ${status === s ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s || 'all'}
          </button>
        ))}
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {['Order #', 'Site', 'Type', 'Amount', 'Status', 'Date', ''].map((h) => <th key={h} className="th">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={7}>Loading…</td></tr>
            ) : data?.items?.length ? (
              data.items.map((o) => (
                <tr key={o.id}>
                  <td className="td font-mono text-xs">{o.orderNumber}</td>
                  <td className="td">{o.orderedSite}</td>
                  <td className="td capitalize">{o.orderType?.replace('_', ' ')}</td>
                  <td className="td">{money(o.amount)}</td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                  <td className="td">{dateTime(o.createdAt)}</td>
                  <td className="td"><Link className="text-brand-600 font-medium" to={`/buyer/orders/${o.id}`}>Open</Link></td>
                </tr>
              ))
            ) : (
              <tr><td className="td text-slate-400 text-center" colSpan={7}>No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
