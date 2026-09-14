import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Wallet, ShoppingBag, Link2, Users } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { money, dateTime } from '@/lib/format';

export default function BuyerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: async () => (await api.get('/wallet')).data.data });
  const { data: orders } = useQuery({ queryKey: ['my-orders', ''], queryFn: async () => (await api.get('/orders/me', { params: { limit: 8 } })).data.data });
  const { data: referrals } = useQuery({ queryKey: ['my-referrals'], queryFn: async () => (await api.get('/referrals/me')).data.data });

  const liveLinks = orders?.items?.filter((o) => o.status === 'delivered').length || 0;

  return (
    <>
      <Seo title="Buyer dashboard" noindex />
      <PageHeader
        title={`Welcome, ${user?.firstName || 'there'}`}
        subtitle="Track your orders, balance and offers."
        action={
          <Link to="/marketplace" className="btn-primary text-sm">Browse marketplace</Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wallet" value={money(wallet?.availableBalance)} icon={Wallet} />
        <StatCard label="Total orders" value={orders?.total ?? 0} icon={ShoppingBag} />
        <StatCard label="Live links" value={liveLinks} icon={Link2} />
        <StatCard label="Referrals" value={referrals?.totalUsed ?? 0} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <section className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent orders</h2>
            <Link to="/buyer/orders" className="text-sm text-brand-600 font-medium">View all</Link>
          </div>
          <div className="mt-4 table-shell overflow-x-auto">
            <table className="min-w-full">
              <thead><tr>{['#', 'Site', 'Amount', 'Status', 'Date'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {orders?.items?.length ? orders.items.map((o) => (
                  <tr key={o.id}>
                    <td className="td font-mono text-xs">{o.orderNumber}</td>
                    <td className="td">{o.orderedSite}</td>
                    <td className="td">{money(o.amount)}</td>
                    <td className="td"><StatusBadge status={o.status} /></td>
                    <td className="td">{dateTime(o.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td className="td text-slate-400 text-center" colSpan={5}>No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-slate-900">Your referral code</h2>
          <div className="mt-2">
            <code className="bg-brand-50 text-brand-700 px-3 py-2 rounded-lg font-bold tracking-wider block text-center">{user?.referralCode}</code>
            <p className="text-sm text-slate-500 mt-3">Share this code — every signup earns you bonus.</p>
            <div className="text-xs text-slate-400 mt-2">{referrals?.totalUsed || 0} used · {money(referrals?.totalEarned)} earned</div>
          </div>
        </section>
      </div>
    </>
  );
}
