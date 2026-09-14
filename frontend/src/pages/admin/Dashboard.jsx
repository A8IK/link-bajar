import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { Users, FileText, ShoppingBag, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-dashboard'], queryFn: async () => (await api.get('/admin/dashboard')).data.data });
  const [commission, setCommission] = useState(20);

  useEffect(() => { if (data) setCommission(data.universalCommission); }, [data]);

  const save = useMutation({
    mutationFn: async () => api.post('/admin/settings/commission', { value: Number(commission) }),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }); },
  });

  return (
    <>
      <Seo title="Admin dashboard" noindex />
      <PageHeader title="Admin dashboard" subtitle="System overview." />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total users" value={data?.totalUsers ?? '—'} icon={Users} />
        <StatCard label="Live listings" value={data?.liveListings ?? '—'} icon={FileText} />
        <StatCard label="Pending orders" value={data?.pendingOrders ?? '—'} icon={Clock} />
        <StatCard label="Pending listings" value={data?.pendingListings ?? '—'} icon={AlertTriangle} />
        <StatCard label="Approved orders" value={data?.approvedOrders ?? '—'} icon={ShoppingBag} />
        <StatCard label="Total earnings" value={money(data?.totalEarnings ?? 0)} icon={TrendingUp} />
      </div>

      <section className="card p-5 mt-6">
        <h2 className="font-semibold text-slate-900">Universal commission rate</h2>
        <p className="text-sm text-slate-500 mt-1">Applied to bulk-uploaded listings.</p>
        <div className="mt-3 flex gap-3 items-end">
          <div className="w-40">
            <label className="label">Rate (%)</label>
            <input type="number" className="input" value={commission} onChange={(e) => setCommission(e.target.value)} />
          </div>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary text-sm">
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>
    </>
  );
}
