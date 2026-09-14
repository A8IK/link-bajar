import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';

export default function AdminFinance() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ userId: '', type: '', from: '', to: '', transactionId: '' });
  const [page, setPage] = useState(1);
  const [showRefund, setShowRefund] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', page, filters],
    queryFn: async () => (await api.get('/wallet/admin/transactions', { params: { page, limit: 25, ...stripEmpty(filters) } })).data.data,
  });

  return (
    <>
      <Seo title="Finance" noindex />
      <PageHeader
        title="Finance"
        subtitle="Transactions, refunds, withdrawals."
        action={<button onClick={() => setShowRefund(true)} className="btn-primary text-sm">Issue refund</button>}
      />

      <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="input" placeholder="User ID (UUID)" value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} />
        <input className="input" placeholder="Transaction ID" value={filters.transactionId} onChange={(e) => setFilters({ ...filters, transactionId: e.target.value })} />
        <select className="input" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {['deposit', 'withdrawal', 'order_payment', 'order_earning', 'refund', 'referral_bonus', 'admin_adjustment'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <input className="input" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input className="input" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['User', 'Type', 'Amount', 'Method', 'Status', 'Gateway #', 'Reference', 'Date'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={8}>Loading…</td></tr>
            ) : data?.items?.length ? data.items.map((t) => (
              <tr key={t.id}>
                <td className="td">
                  <div className="text-sm">{t.User?.email || '—'}</div>
                  <div className="text-xs text-slate-400">{t.User?.publicId}</div>
                </td>
                <td className="td capitalize">{t.type?.replace('_', ' ')}</td>
                <td className="td">{money(t.amount)}</td>
                <td className="td">{t.method || '—'}</td>
                <td className="td"><StatusBadge status={t.status} /></td>
                <td className="td font-mono text-xs">{t.gatewayTransactionId || '—'}</td>
                <td className="td font-mono text-xs">{t.reference}</td>
                <td className="td text-xs">{dateTime(t.createdAt)}</td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={8}>No transactions.</td></tr>
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

      {showRefund && <RefundModal onClose={() => setShowRefund(false)} onDone={() => qc.invalidateQueries({ queryKey: ['admin-transactions'] })} />}
    </>
  );
}

function RefundModal({ onClose, onDone }) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/wallet/admin/refunds', { userId, amount: Number(amount), reason });
      toast.success('Refunded');
      onDone(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-900 mb-4">Issue refund</h3>
        <div className="space-y-3">
          <div><label className="label">User ID (UUID)</label><input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} /></div>
          <div><label className="label">Amount</label><input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><label className="label">Reason</label><textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <button onClick={submit} disabled={loading || !userId || !amount} className="btn-primary w-full">{loading ? 'Processing…' : 'Refund'}</button>
        </div>
      </div>
    </div>
  );
}

const stripEmpty = (o) => Object.fromEntries(Object.entries(o).filter(([_, v]) => v !== '' && v != null));
