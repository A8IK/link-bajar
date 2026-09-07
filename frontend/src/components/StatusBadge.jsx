import clsx from 'clsx';

const COLOR = {
  pending: 'bg-amber-100 text-amber-700',
  pending_verification: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-sky-100 text-sky-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
  blocked: 'bg-red-100 text-red-700',
  refunded: 'bg-slate-200 text-slate-700',
  paused: 'bg-slate-100 text-slate-600',
  expired: 'bg-slate-100 text-slate-600',
  completed: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-sky-100 text-sky-700',
};

export default function StatusBadge({ status }) {
  const cls = COLOR[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={clsx('badge', cls)}>{status?.replace('_', ' ')}</span>
  );
}
