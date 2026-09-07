export default function StatCard({ label, value, delta, icon: Icon, accent = 'brand' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
          {delta && <div className="text-xs text-emerald-600 mt-1">{delta}</div>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${accent}-50 text-${accent}-600`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
