function StatusBadge({ status, type = 'status' }) {
  const palettes = {
    status: {
      ACTIVE: 'bg-emerald-100 text-emerald-800',
      'EXPIRING SOON': 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
      RETAIN: 'bg-emerald-100 text-emerald-800',
      REVIEW: 'bg-yellow-100 text-yellow-800',
      EXPIRE: 'bg-red-100 text-red-800',
      LOW: 'bg-emerald-100 text-emerald-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800',
    },
  };

  const palette = palettes[type]?.[status] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${palette}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
