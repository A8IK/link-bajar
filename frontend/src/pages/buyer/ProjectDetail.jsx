import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Seo from '@/components/Seo';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Trash2 } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const [emails, setEmails] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get(`/projects/${id}`)).data.data,
  });

  if (!project) return <div className="text-slate-400">Loading…</div>;
  const isOwner = project.ownerId === user.id;

  const invite = async () => {
    const list = emails.split(/[\s,;]+/).filter(Boolean);
    if (!list.length) return;
    try {
      await api.post(`/projects/${id}/invites`, { emails: list });
      toast.success(`Invited ${list.length}`);
      setEmails('');
      qc.invalidateQueries({ queryKey: ['project', id] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${memberId}`);
    qc.invalidateQueries({ queryKey: ['project', id] });
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project?')) return;
    await api.delete(`/projects/${id}`);
    toast.success('Project deleted');
    nav('/buyer/projects');
  };

  return (
    <>
      <Seo title={project.name} noindex />
      <PageHeader
        title={project.name}
        subtitle={project.description || 'No description'}
        action={isOwner && <button onClick={deleteProject} className="btn-danger text-sm">Delete project</button>}
      />

      {isOwner && (
        <section className="card p-5 mb-6">
          <h2 className="font-semibold text-slate-900">Invite teammates</h2>
          <p className="text-sm text-slate-500 mt-1">Separate multiple emails with commas, spaces, or newlines.</p>
          <div className="flex gap-2 mt-3">
            <input className="input" placeholder="alice@example.com, bob@example.com" value={emails} onChange={(e) => setEmails(e.target.value)} />
            <button onClick={invite} className="btn-primary text-sm">Send invites</button>
          </div>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900">Members</h2>
        <div className="mt-3 table-shell overflow-x-auto">
          <table className="min-w-full">
            <thead><tr>{['Email', 'Role', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {project.members?.map((m) => (
                <tr key={m.id}>
                  <td className="td">{m.user?.email || m.email}</td>
                  <td className="td capitalize">{m.role}</td>
                  <td className="td"><StatusBadge status={m.status} /></td>
                  <td className="td">
                    {isOwner && m.role !== 'owner' && (
                      <button onClick={() => removeMember(m.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
