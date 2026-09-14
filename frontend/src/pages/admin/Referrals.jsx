import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, dateTime } from '@/lib/format';

export default function AdminReferrals() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-referrals'], queryFn: async () => (await api.get('/referrals')).data.data });

  return (
    <>
      <Seo title="Referrals" noindex />
      <PageHeader title="Referrals" subtitle={`${data?.length ?? 0} total`} />
      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['Code', 'Discount', 'Min order', 'Expiry days', 'Bonus earned', 'First-order only', 'Status', 'Date'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={8}>Loading…</td></tr>
            ) : data?.length ? data.map((r) => (
              <tr key={r.id}>
                <td className="td font-mono">{r.referralCode}</td>
                <td className="td">{r.discountType === 'percentage' ? `${r.discountValue}%` : money(r.discountValue)}</td>
                <td className="td">{money(r.minOrderAmount)}</td>
                <td className="td">{r.expiryDays}</td>
                <td className="td">{money(r.bonusEarned)}</td>
                <td className="td">{r.isFirstOrderOnly ? 'Yes' : 'No'}</td>
                <td className="td"><StatusBadge status={r.status} /></td>
                <td className="td text-xs">{dateTime(r.createdAt)}</td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={8}>No referrals.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
