import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { date } from '@/lib/format';

export default function BuyerProjects() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: async () => (await api.get('/projects')).data.data });

  return (
    <>
      <Seo title="Projects" noindex />
      <PageHeader
        title="Projects"
        subtitle="Collaborate with your team."
        action={<button className="btn-primary text-sm" onClick={() => setShowNew(true)}>+ New project</button>}
      />

      {isLoading ? (
        <div className="text-slate-400">Loading…</div>
      ) : data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => (
            <Link key={p.id} to={`/buyer/projects/${p.id}`} className="card p-5 hover:shadow-md transition">
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description || 'No description'}</p>
              <div className="text-xs text-slate-400 mt-3">{p.members?.length || 0} member(s) · created {date(p.createdAt)}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-sm text-slate-400">No projects yet.</div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onDone={() => qc.invalidateQueries({ queryKey: ['projects'] })} />}
    </>
  );
}

function NewProjectModal({ onClose, onDone }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/projects', { name, description });
      toast.success('Project created');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-900 mb-4">New project</h3>
        <div className="space-y-3">
          <div><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <button onClick={submit} disabled={loading || !name} className="btn-primary w-full">{loading ? 'Creating…' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
