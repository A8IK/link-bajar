import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import Seo from '@/components/Seo';

export default function ProjectInvite() {
  const { token } = useParams();
  const nav = useNavigate();
  const [status, setStatus] = useState('accepting');

  useEffect(() => {
    (async () => {
      try {
        await api.post(`/projects/invites/${token}/accept`);
        setStatus('accepted');
        toast.success('Invite accepted');
        setTimeout(() => nav('/buyer/projects'), 1200);
      } catch (err) {
        setStatus('error');
        toast.error(err.response?.data?.message || 'Could not accept invite');
      }
    })();
  }, [token, nav]);

  return (
    <>
      <Seo title="Project invite" noindex />
      <div className="max-w-md mx-auto card p-8 mt-16 text-center">
        {status === 'accepting' && <div className="text-slate-500">Accepting invite…</div>}
        {status === 'accepted' && <div className="text-emerald-600">You're in! Redirecting…</div>}
        {status === 'error' && <div className="text-red-600">Invite invalid or expired.</div>}
      </div>
    </>
  );
}
