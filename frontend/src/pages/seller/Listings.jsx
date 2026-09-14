import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, fmtNumber } from '@/lib/format';
import { Trash2 } from 'lucide-react';

export default function SellerListings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => (await api.get('/listings/mine')).data.data,
  });

  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <>
      <Seo title="My listings" noindex />
      <PageHeader
        title="My listings"
        subtitle={`${data?.length ?? 0} site(s)`}
        action={
          <div className="flex gap-2">
            <Link to="/seller/listings/bulk" className="btn-secondary text-sm">Bulk upload</Link>
            <Link to="/seller/listings/new" className="btn-primary text-sm">+ Add listing</Link>
          </div>
        }
      />
      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['Site', 'Type', 'DA', 'DR', 'Traffic', 'TAT', 'Price', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={9}>Loading…</td></tr>
            ) : data?.length ? data.map((l) => (
              <tr key={l.id}>
                <td className="td font-medium">{l.siteUrl}</td>
                <td className="td capitalize">{l.placementType?.replace('_', ' ')}</td>
                <td className="td">{l.mozDa || '—'}</td>
                <td className="td">{l.ahrefDr || '—'}</td>
                <td className="td">{fmtNumber(l.monthlyTraffic)}</td>
                <td className="td">{l.tatDays || '—'}</td>
                <td className="td">{money(l.guestPostPrice || l.linkInsertPrice || 0)}</td>
                <td className="td"><StatusBadge status={l.status} /></td>
                <td className="td">
                  <button onClick={() => remove(l.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={9}>No listings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
