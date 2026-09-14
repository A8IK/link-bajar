import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';
import { Trash2, Edit2, Send } from 'lucide-react';

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [broadcasting, setBroadcasting] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: async () => (await api.get('/coupons')).data.data });

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/coupons/${id}`); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); } catch { toast.error('Failed'); }
  };

  return (
    <>
      <Seo title="Coupons" noindex />
      <PageHeader
        title="Coupons"
        subtitle={`${data?.length ?? 0} total`}
        action={<button onClick={() => setEditing({})} className="btn-primary text-sm">+ New coupon</button>}
      />

      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['Code', 'Type', 'Value', 'Uses', 'Min order', 'Max discount', 'Expires', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={9}>Loading…</td></tr>
            ) : data?.length ? data.map((c) => (
              <tr key={c.id}>
                <td className="td font-mono font-bold">{c.code}</td>
                <td className="td capitalize">{c.discountType}</td>
                <td className="td">{c.discountType === 'percentage' ? `${c.discountValue}%` : money(c.discountValue)}</td>
                <td className="td">{c.usesCount}{c.maxTotalUsage ? ` / ${c.maxTotalUsage}` : ''}</td>
                <td className="td">{money(c.minOrderAmount)}</td>
                <td className="td">{c.maxDiscountAmount ? money(c.maxDiscountAmount) : '—'}</td>
                <td className="td text-xs">{c.expiryDate ? dateTime(c.expiryDate) : '—'}</td>
                <td className="td"><StatusBadge status={c.status} /></td>
                <td className="td flex gap-2">
                  <button onClick={() => setBroadcasting(c)} className="text-brand-600 hover:text-brand-700" title="Broadcast"><Send size={14} /></button>
                  <button onClick={() => setEditing(c)} className="text-slate-500 hover:text-slate-700"><Edit2 size={14} /></button>
                  <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={9}>No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <CouponModal coupon={editing} onClose={() => setEditing(null)} onDone={() => qc.invalidateQueries({ queryKey: ['admin-coupons'] })} />}
      {broadcasting && <BroadcastModal coupon={broadcasting} onClose={() => setBroadcasting(null)} />}
    </>
  );
}

function CouponModal({ coupon, onClose, onDone }) {
  const isNew = !coupon.id;
  const [form, setForm] = useState({
    code: coupon.code || '',
    discountType: coupon.discountType || 'percentage',
    discountValue: coupon.discountValue || 10,
    maxDiscountAmount: coupon.maxDiscountAmount || '',
    minOrderAmount: coupon.minOrderAmount || 0,
    maxTotalUsage: coupon.maxTotalUsage || '',
    applicableTo: coupon.applicableTo || 'all',
    couponType: coupon.couponType || 'public',
    startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : '',
    expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : '',
    status: coupon.status || 'active',
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const body = { ...form, code: form.code.toUpperCase().trim() };
      Object.keys(body).forEach((k) => body[k] === '' && delete body[k]);
      if (isNew) await api.post('/coupons', body);
      else await api.put(`/coupons/${coupon.id}`, body);
      toast.success('Saved');
      onDone(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-900 mb-4">{isNew ? 'New coupon' : `Edit ${coupon.code}`}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Code"><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['active', 'inactive', 'expired'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Discount type">
            <select className="input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </Field>
          <Field label="Discount value"><input className="input" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} /></Field>
          <Field label="Min order amount"><input className="input" type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} /></Field>
          <Field label="Max discount amount"><input className="input" type="number" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} /></Field>
          <Field label="Max total usage"><input className="input" type="number" value={form.maxTotalUsage} onChange={(e) => setForm({ ...form, maxTotalUsage: e.target.value })} /></Field>
          <Field label="Applicable to">
            <select className="input" value={form.applicableTo} onChange={(e) => setForm({ ...form, applicableTo: e.target.value })}>
              <option value="all">All buyers</option>
              <option value="first_order">First order only</option>
              <option value="specific_users">Specific users</option>
            </select>
          </Field>
          <Field label="Start date"><input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Expiry date"><input className="input" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
        </div>
        <button onClick={submit} disabled={loading || !form.code} className="btn-primary w-full mt-4">{loading ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}

function BroadcastModal({ coupon, onClose }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/coupons/broadcast', { couponId: coupon.id, message });
      toast.success(`Queued for ${data.queued} users`);
      onClose();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-900 mb-4">Broadcast {coupon.code}</h3>
        <textarea className="input" rows={4} placeholder="Custom message…" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button onClick={send} disabled={loading} className="btn-primary w-full mt-3">{loading ? 'Sending…' : 'Send to all users'}</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
