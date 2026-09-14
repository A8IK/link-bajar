import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { Wallet as WIcon, Gift, Clock, Plus, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';

export default function BuyerWallet() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showWd, setShowWd] = useState(false);

  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: async () => (await api.get('/wallet')).data.data });
  const { data: txns } = useQuery({ queryKey: ['wallet-txns'], queryFn: async () => (await api.get('/wallet/transactions', { params: { limit: 30 } })).data.data });
  const { data: invoices } = useQuery({ queryKey: ['my-invoices'], queryFn: async () => (await api.get('/wallet/invoices')).data.data });

  return (
    <>
      <Seo title="Wallet" noindex />
      <PageHeader
        title="Wallet & Credits"
        subtitle="Manage your balance, withdrawals and invoices."
        action={
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => setShowWd(true)}>Request withdrawal</button>
            <button className="btn-primary text-sm" onClick={() => setShowAdd(true)}><Plus size={16} /> Add funds</button>
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Available" value={money(wallet?.availableBalance)} icon={WIcon} />
        <StatCard label="Bonus" value={money(wallet?.bonusBalance)} icon={Gift} />
        <StatCard label="Pending" value={money(wallet?.pendingBalance)} icon={Clock} />
      </div>

      <section className="card p-5 mt-6">
        <h2 className="font-semibold text-slate-900">Transaction history</h2>
        <div className="table-shell mt-3 overflow-x-auto">
          <table className="min-w-full">
            <thead><tr>{['Date', 'Type', 'Method', 'Amount', 'Status', 'Reference'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {txns?.items?.length ? txns.items.map((t) => (
                <tr key={t.id}>
                  <td className="td">{dateTime(t.createdAt)}</td>
                  <td className="td capitalize">{t.type?.replace('_', ' ')}</td>
                  <td className="td">{t.method || '—'}</td>
                  <td className="td">{money(t.amount)}</td>
                  <td className="td"><StatusBadge status={t.status} /></td>
                  <td className="td font-mono text-xs">{t.reference}</td>
                </tr>
              )) : (
                <tr><td className="td text-slate-400 text-center" colSpan={6}>No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5 mt-6">
        <h2 className="font-semibold text-slate-900">Invoices</h2>
        <div className="table-shell mt-3 overflow-x-auto">
          <table className="min-w-full">
            <thead><tr>{['Invoice #', 'Date', 'Amount', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {invoices?.length ? invoices.map((i) => (
                <tr key={i.id}>
                  <td className="td font-mono text-xs">{i.invoiceNumber}</td>
                  <td className="td">{dateTime(i.issuedAt)}</td>
                  <td className="td">{money(i.amount)}</td>
                  <td className="td"><StatusBadge status={i.status} /></td>
                  <td className="td">
                    <a className="text-brand-600 inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={`${import.meta.env.VITE_API_URL || ''}/api/v1/wallet/invoices/${i.id}/download`}>
                      <Download size={14} /> Download
                    </a>
                  </td>
                </tr>
              )) : (
                <tr><td className="td text-slate-400 text-center" colSpan={5}>No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showAdd && <AddFundsModal onClose={() => setShowAdd(false)} onDone={() => { qc.invalidateQueries({ queryKey: ['wallet'] }); qc.invalidateQueries({ queryKey: ['wallet-txns'] }); }} />}
      {showWd && <WithdrawModal balance={Number(wallet?.availableBalance || 0)} onClose={() => setShowWd(false)} onDone={() => qc.invalidateQueries({ queryKey: ['wallet'] })} />}
    </>
  );
}

function AddFundsModal({ onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('sslcommerz');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/deposits/intent', { amount: Number(amount), method });
      // Demo: confirm immediately. Real gateway would redirect.
      await api.post('/wallet/deposits/confirm', { transactionId: data.data.transaction.id });
      toast.success('Funds added');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Add funds">
      <div className="space-y-3">
        <div><label className="label">Amount (USD)</label><input className="input" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><label className="label">Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="sslcommerz">SSL Commerz</option>
            <option value="payoneer">Payoneer</option>
            <option value="stripe">Stripe</option>
          </select>
        </div>
        <button onClick={submit} disabled={loading || !amount} className="btn-primary w-full">{loading ? 'Processing…' : 'Add funds'}</button>
      </div>
    </Modal>
  );
}

function WithdrawModal({ balance, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/wallet/withdrawals', { amount: Number(amount), requestedMethod: method, paymentAddress });
      toast.success('Withdrawal requested');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Request withdrawal">
      <div className="space-y-3">
        <div className="text-xs text-slate-500">Available: {money(balance)}</div>
        <div><label className="label">Amount</label><input className="input" type="number" max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><label className="label">Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="bank">Bank transfer</option>
            <option value="payoneer">Payoneer</option>
            <option value="sslcommerz">SSL Commerz</option>
          </select>
        </div>
        <div><label className="label">Payment address / account</label><input className="input" value={paymentAddress} onChange={(e) => setPaymentAddress(e.target.value)} /></div>
        <button onClick={submit} disabled={loading || !amount} className="btn-primary w-full">{loading ? 'Submitting…' : 'Request'}</button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
