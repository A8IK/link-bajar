import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { money, fmtNumber } from '@/lib/format';
import { Check, X, Trash2 } from 'lucide-react';

export default function AdminListings() {
  const qc = useQueryClient();
  const inputRef = useRef(null);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', page, filters],
    queryFn: async () => (await api.get('/listings/all', { params: { page, limit: 25, ...stripEmpty(filters) } })).data.data,
  });

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/listings/${id}/status`, { status });
      toast.success('Updated');
      qc.invalidateQueries({ queryKey: ['admin-listings'] });
    } catch { toast.error('Failed'); }
  };
  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/listings/${id}`); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-listings'] }); } catch { toast.error('Failed'); }
  };

  const bulkUpload = async (file) => {
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/listings/bulk', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${data.data.createdCount}, skipped ${data.data.skippedCount}`);
      qc.invalidateQueries({ queryKey: ['admin-listings'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <>
      <Seo title="Listings" noindex />
      <PageHeader
        title="Listings"
        subtitle={`${data?.total ?? 0} total`}
        action={
          <>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && bulkUpload(e.target.files[0])} />
            <button className="btn-primary text-sm" onClick={() => inputRef.current?.click()}>Bulk upload (.xlsx)</button>
          </>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'approved', 'rejected', 'paused'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setFilters({ ...filters, status: s }); setPage(1); }}
            className={`badge cursor-pointer ${filters.status === s ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s || 'all'}
          </button>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <input className="input" placeholder="Search by site URL" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['Site', 'Seller', 'DA', 'DR', 'Traffic', 'TAT', 'Price', 'Source', 'Status', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={10}>Loading…</td></tr>
            ) : data?.items?.length ? data.items.map((l) => (
              <tr key={l.id}>
                <td className="td font-medium">{l.siteUrl}</td>
                <td className="td text-xs">{l.seller?.email || l.addedByAdminEmail || '—'}</td>
                <td className="td">{l.mozDa || '—'}</td>
                <td className="td">{l.ahrefDr || '—'}</td>
                <td className="td">{fmtNumber(l.monthlyTraffic)}</td>
                <td className="td">{l.tatDays || '—'}</td>
                <td className="td">{money(l.guestPostPrice || l.linkInsertPrice || 0)}</td>
                <td className="td capitalize text-xs">{l.source}</td>
                <td className="td"><StatusBadge status={l.status} /></td>
                <td className="td flex gap-2">
                  {l.status !== 'approved' && <button onClick={() => setStatus(l.id, 'approved')} className="text-emerald-600 hover:text-emerald-700"><Check size={14} /></button>}
                  {l.status !== 'rejected' && <button onClick={() => setStatus(l.id, 'rejected')} className="text-amber-600 hover:text-amber-700"><X size={14} /></button>}
                  <button onClick={() => remove(l.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={10}>No listings.</td></tr>
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
    </>
  );
}

const stripEmpty = (o) => Object.fromEntries(Object.entries(o).filter(([_, v]) => v !== '' && v != null));
