import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { Trash2 } from 'lucide-react';

export default function AdminNiches() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['niches'], queryFn: async () => (await api.get('/niches')).data.data });

  const create = async () => {
    if (!name.trim()) return;
    try {
      await api.post('/niches', { name, isSensitive });
      setName(''); setIsSensitive(false);
      qc.invalidateQueries({ queryKey: ['niches'] });
    } catch { toast.error('Failed'); }
  };
  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/niches/${id}`); qc.invalidateQueries({ queryKey: ['niches'] }); } catch { toast.error('Failed'); }
  };

  return (
    <>
      <Seo title="Niches" noindex />
      <PageHeader title="Niches" subtitle={`${data?.length ?? 0} niches`} />

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-slate-900">Add niche</h3>
        <div className="flex gap-3 items-end mt-3">
          <div className="flex-1"><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm pb-3">
            <input type="checkbox" checked={isSensitive} onChange={(e) => setIsSensitive(e.target.checked)} />
            Sensitive
          </label>
          <button onClick={create} className="btn-primary text-sm">Add</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          <div className="text-slate-400">Loading…</div>
        ) : data?.map((n) => (
          <div key={n.id} className="card p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{n.name}</div>
              {n.isSensitive && <div className="text-xs text-amber-600 mt-0.5">Sensitive</div>}
            </div>
            <button onClick={() => remove(n.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </>
  );
}
