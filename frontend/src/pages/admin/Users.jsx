import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { Trash2, Ban, CheckCircle } from 'lucide-react';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, filters],
    queryFn: async () => (await api.get('/admin/users', { params: { page, limit: 25, ...stripEmpty(filters) } })).data.data,
  });

  const setUserStatus = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}`, { status });
      toast.success('Updated');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch { toast.error('Failed'); }
  };
  const removeUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-users'] }); } catch { toast.error('Failed'); }
  };

  return (
    <>
      <Seo title="Users" noindex />
      <PageHeader title="Users" subtitle={`${data?.total ?? 0} total`} />

      <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="input" placeholder="Search email/name/ID" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="input" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All roles</option>
          {['admin', 'buyer', 'seller', 'agency', 'partnership'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {['active', 'blocked', 'pending_verification'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>{['Email', 'Name', 'User ID', 'Reg. IP', 'Country', 'Phone', 'Joined', 'Role', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td text-slate-400 text-center" colSpan={10}>Loading…</td></tr>
            ) : data?.items?.length ? data.items.map((u) => (
              <tr key={u.id}>
                <td className="td">{u.email}</td>
                <td className="td">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}</td>
                <td className="td font-mono text-xs">{u.publicId}</td>
                <td className="td text-xs">{u.registrationIp || '—'}</td>
                <td className="td">{u.country || u.profileCountry || '—'}</td>
                <td className="td">{u.phone || '—'}</td>
                <td className="td">{dateTime(u.createdAt)}</td>
                <td className="td capitalize">{u.role}</td>
                <td className="td"><StatusBadge status={u.status} /></td>
                <td className="td flex gap-2">
                  {u.status === 'blocked' ? (
                    <button onClick={() => setUserStatus(u.id, 'active')} className="text-emerald-600 hover:text-emerald-700" title="Unblock"><CheckCircle size={14} /></button>
                  ) : (
                    <button onClick={() => setUserStatus(u.id, 'blocked')} className="text-amber-600 hover:text-amber-700" title="Block"><Ban size={14} /></button>
                  )}
                  <button onClick={() => removeUser(u.id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
                </td>
              </tr>
            )) : (
              <tr><td className="td text-slate-400 text-center" colSpan={10}>No users.</td></tr>
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
