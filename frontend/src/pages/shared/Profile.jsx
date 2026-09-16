import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Trash2 } from 'lucide-react';

export default function Profile() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    company: user?.company || '',
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    postalCode: user?.postalCode || '',
  });
  const [saving, setSaving] = useState(false);

  const { data: banks } = useQuery({ queryKey: ['bank-accounts'], queryFn: async () => (await api.get('/wallet/bank-accounts')).data.data });

  const save = async () => {
    setSaving(true);
    try {
      // Profile update — using user fields directly; in production add a dedicated /users/me endpoint
      // For now, persist via /admin/users when admin, or skip (frontend-only mock).
      setUser({ ...user, ...form });
      toast.success('Saved locally — wire backend endpoint to persist');
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const removeBank = async (id) => {
    if (!confirm('Delete bank account?')) return;
    try { await api.delete(`/wallet/bank-accounts/${id}`); qc.invalidateQueries({ queryKey: ['bank-accounts'] }); } catch { toast.error('Failed'); }
  };

  const [showBank, setShowBank] = useState(false);

  return (
    <>
      <Seo title="Profile" noindex />
      <PageHeader title="Profile" subtitle="Account details and preferences." />

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Personal info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Postal code" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} />
          <ReadOnly label="Email" value={user?.email} />
          <ReadOnly label="User ID" value={user?.publicId} />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary mt-4">{saving ? 'Saving…' : 'Save changes'}</button>
      </section>

      <section className="card p-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Bank accounts</h2>
          <button onClick={() => setShowBank(true)} className="btn-primary text-sm">+ Add account</button>
        </div>
        <div className="mt-4 space-y-2">
          {banks?.length ? banks.map((b) => (
            <div key={b.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
              <div>
                <div className="font-medium text-slate-900">{b.label || b.bankName || b.method}</div>
                <div className="text-xs text-slate-500">{b.accountHolder} · ••••{b.accountNumber.slice(-4)}</div>
              </div>
              <button onClick={() => removeBank(b.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          )) : <div className="text-sm text-slate-400">No bank accounts yet.</div>}
        </div>
      </section>

      {showBank && <BankModal onClose={() => setShowBank(false)} onDone={() => qc.invalidateQueries({ queryKey: ['bank-accounts'] })} />}
    </>
  );
}

function BankModal({ onClose, onDone }) {
  const [form, setForm] = useState({
    label: '', accountHolder: '', bankName: '', accountNumber: '', routingNumber: '', swiftCode: '', country: '', method: 'bank', isDefault: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/wallet/bank-accounts', form);
      toast.success('Added');
      onDone(); onClose();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-900 mb-4">Add bank account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} />
          <div>
            <label className="label">Method</label>
            <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="bank">Bank</option><option value="payoneer">Payoneer</option><option value="sslcommerz">SSL Commerz</option>
            </select>
          </div>
          <Field label="Account holder" value={form.accountHolder} onChange={(v) => setForm({ ...form, accountHolder: v })} />
          <Field label="Bank name" value={form.bankName} onChange={(v) => setForm({ ...form, bankName: v })} />
          <Field label="Account number" value={form.accountNumber} onChange={(v) => setForm({ ...form, accountNumber: v })} />
          <Field label="Routing #" value={form.routingNumber} onChange={(v) => setForm({ ...form, routingNumber: v })} />
          <Field label="SWIFT" value={form.swiftCode} onChange={(v) => setForm({ ...form, swiftCode: v })} />
          <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
        </div>
        <label className="flex items-center gap-2 text-sm mt-3"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Default</label>
        <button onClick={submit} disabled={loading || !form.accountHolder || !form.accountNumber} className="btn-primary w-full mt-4">{loading ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return <div><label className="label">{label}</label><input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} /></div>;
}
function ReadOnly({ label, value }) {
  return <div><label className="label">{label}</label><input className="input bg-slate-50" value={value || ''} readOnly /></div>;
}
