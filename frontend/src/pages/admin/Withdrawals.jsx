import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';

export default function AdminWithdrawals() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', status],
    queryFn: async () => (await api.get('/wallet/admin/withdrawals', { params: { status: status || undefined } })).data.data,
  });

  const act = async (id, action) => {
    try {
      await api.post(`/wallet/admin/withdrawals/${id}/process`, { action });
      toast.success(`Marked ${action}`);
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <>
      <Seo title="Withdrawal requests" noindex />
      <PageHeader title="Withdrawal requests" />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'approved', 'processing', 'completed', 'rejected'].map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)} className={`badge cursor-pointer ${status === s ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {s || 'all'}
          </button>
        ))}
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['Date', 'User', 'Amount', 'Method', 'Address', 'Status', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={7}>Loading…</td></tr>
            ) : data?.length ? data.map((w) => (
              <tr key={w.id}>
                <td className="td text-xs">{dateTime(w.createdAt)}</td>
                <td className="td">
                  <div className="text-sm">{w.User?.email}</div>
                  <div className="text-xs text-slate-400">{w.User?.publicId}</div>
                </td>
                <td className="td font-medium">{money(w.amount)}</td>
                <td className="td">{w.requestedMethod}</td>
                <td className="td text-xs">{w.paymentAddress || '—'}</td>
                <td className="td"><StatusBadge status={w.status} /></td>
                <td className="td flex gap-2">
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => act(w.id, 'approve')} className="badge bg-emerald-100 text-emerald-700">Approve</button>
                      <button onClick={() => act(w.id, 'reject')} className="badge bg-red-100 text-red-700">Reject</button>
                    </>
                  )}
                  {w.status === 'approved' && (
                    <button onClick={() => act(w.id, 'complete')} className="badge bg-brand-100 text-brand-700">Complete</button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={7}>No requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
