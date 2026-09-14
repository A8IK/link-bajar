import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';
import { Wallet, Banknote, Gift } from 'lucide-react';

export default function SellerWallet() {
  const qc = useQueryClient();
  const [showWd, setShowWd] = useState(false);
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: async () => (await api.get('/wallet')).data.data });
  const { data: wds } = useQuery({ queryKey: ['my-withdrawals'], queryFn: async () => (await api.get('/wallet/withdrawals/me')).data.data });
  const { data: txns } = useQuery({ queryKey: ['wallet-txns'], queryFn: async () => (await api.get('/wallet/transactions', { params: { limit: 30 } })).data.data });

  return (
    <>
      <Seo title="Seller wallet" noindex />
      <PageHeader
        title="Wallet"
        action={<button className="btn-primary text-sm" onClick={() => setShowWd(true)}>Request withdrawal</button>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Available" value={money(wallet?.availableBalance)} icon={Wallet} />
        <StatCard label="Pending" value={money(wallet?.pendingBalance)} icon={Banknote} />
        <StatCard label="Referral bonus" value={money(wallet?.referralBalance)} icon={Gift} />
      </div>

      <section className="card p-5 mt-6">
        <h2 className="font-semibold text-slate-900">Withdrawal requests</h2>
        <div className="table-shell mt-3 overflow-x-auto">
          <table className="min-w-full">
            <thead><tr>{['Date', 'Amount', 'Method', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {wds?.length ? wds.map((w) => (
                <tr key={w.id}>
                  <td className="td">{dateTime(w.createdAt)}</td>
                  <td className="td">{money(w.amount)}</td>
                  <td className="td">{w.requestedMethod}</td>
                  <td className="td"><StatusBadge status={w.status} /></td>
                </tr>
              )) : <tr><td className="td text-slate-400 text-center" colSpan={4}>No requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5 mt-6">
        <h2 className="font-semibold text-slate-900">Transactions</h2>
        <div className="table-shell mt-3 overflow-x-auto">
          <table className="min-w-full">
            <thead><tr>{['Date', 'Type', 'Amount', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {txns?.items?.length ? txns.items.map((t) => (
                <tr key={t.id}>
                  <td className="td">{dateTime(t.createdAt)}</td>
                  <td className="td capitalize">{t.type?.replace('_', ' ')}</td>
                  <td className="td">{money(t.amount)}</td>
                  <td className="td"><StatusBadge status={t.status} /></td>
                </tr>
              )) : <tr><td className="td text-slate-400 text-center" colSpan={4}>No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showWd && (
        <WithdrawalModal
          balance={Number(wallet?.availableBalance || 0)}
          onClose={() => setShowWd(false)}
          onDone={() => { qc.invalidateQueries({ queryKey: ['wallet'] }); qc.invalidateQueries({ queryKey: ['my-withdrawals'] }); }}
        />
      )}
    </>
  );
}

function WithdrawalModal({ balance, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/wallet/withdrawals', { amount: Number(amount), requestedMethod: method, paymentAddress });
      toast.success('Requested');
      onDone(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-900 mb-4">Request withdrawal</h3>
        <div className="text-xs text-slate-500 mb-3">Available: {money(balance)}</div>
        <div className="space-y-3">
          <div><label className="label">Amount</label><input className="input" type="number" max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><label className="label">Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="bank">Bank</option>
              <option value="payoneer">Payoneer</option>
              <option value="sslcommerz">SSL Commerz</option>
            </select>
          </div>
          <div><label className="label">Payment address</label><input className="input" value={paymentAddress} onChange={(e) => setPaymentAddress(e.target.value)} /></div>
          <button onClick={submit} disabled={loading || !amount} className="btn-primary w-full">{loading ? 'Submitting…' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
}
