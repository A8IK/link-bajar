import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { Wallet, FileText, TrendingUp, Gift } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function SellerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: async () => (await api.get('/wallet')).data.data });
  const { data: listings } = useQuery({ queryKey: ['my-listings'], queryFn: async () => (await api.get('/listings/mine')).data.data });
  const { data: referrals } = useQuery({ queryKey: ['my-referrals'], queryFn: async () => (await api.get('/referrals/me')).data.data });

  const active = listings?.filter((l) => l.status === 'approved').length || 0;
  const pending = listings?.filter((l) => l.status === 'pending').length || 0;

  return (
    <>
      <Seo title="Seller dashboard" noindex />
      <PageHeader title="Seller dashboard" subtitle="Listings, orders and earnings." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Balance" value={money(wallet?.availableBalance)} icon={Wallet} />
        <StatCard label="Active listings" value={active} icon={FileText} />
        <StatCard label="Pending listings" value={pending} icon={FileText} />
        <StatCard label="Referral bonus" value={money(wallet?.referralBalance)} icon={Gift} />
      </div>

      <section className="card p-5 mt-6">
        <h2 className="font-semibold text-slate-900">Referral code</h2>
        <div className="flex items-center gap-3 mt-2">
          <code className="bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg font-bold tracking-wider">{user?.referralCode}</code>
          <span className="text-sm text-slate-500">Used by {referrals?.totalUsed || 0} buyers · {money(referrals?.totalEarned)} earned</span>
        </div>
      </section>
    </>
  );
}
