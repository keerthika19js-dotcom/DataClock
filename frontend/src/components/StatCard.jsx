import { ArrowUpRight } from 'lucide-react';

function StatCard({ title, value, subtitle, tone = 'indigo', icon: Icon }) {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    slate: 'bg-slate-100 text-slate-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-xl p-2 ${map[tone]}`}>
          <Icon size={18} />
        </div>
        <ArrowUpRight className="text-slate-400" size={16} />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export default StatCard;
