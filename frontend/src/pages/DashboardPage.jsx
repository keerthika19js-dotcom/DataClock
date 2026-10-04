import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  Clock3,
  Database,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getDashboardStats, runExpiryScan, seedDemoData } from '../services/api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await getDashboardStats();
      setStats(data);
      setMessage('');
    } catch (err) {
      setMessage(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeed = async () => {
    try {
      const { data } = await seedDemoData();
      setMessage(data.message || 'Demo data loaded.');
      await loadStats();
    } catch (err) {
      setMessage(err.message || 'Unable to seed demo data.');
    }
  };

  const handleScan = async () => {
    setProcessing(true);
    try {
      const { data } = await runExpiryScan();
      setMessage(data.message || 'Expiry scan completed.');
      await loadStats();
    } catch (err) {
      setMessage(err.message || 'Expiry scan failed.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Layout><div className="rounded-2xl bg-white p-6 shadow-soft">Loading dashboard…</div></Layout>;
  }

  const statusChart = (stats?.data?.statusDistribution || []).map((item) => ({ name: item.name, value: item.value }));
  const riskChart = (stats?.data?.riskDistribution || []).map((item) => ({ name: item.name || 'Unknown', value: item.value }));
  const typeChart = (stats?.data?.typeDistribution || []).map((item) => ({ name: item.name, value: item.value }));
  const mlChart = (stats?.data?.mlDistribution || []).map((item) => ({ name: item.name, value: item.value }));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Overview</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Privacy retention dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSeed} className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 font-medium text-violet-700 hover:bg-violet-100">Load Demo Data</button>
            <button onClick={handleScan} disabled={processing} className="rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700 disabled:opacity-60">{processing ? 'Running...' : 'Run Expiry Scan'}</button>
          </div>
        </div>

        {message ? <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">{message}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Records" value={stats?.totalRecords || 0} subtitle="All managed records" tone="indigo" icon={Database} />
          <StatCard title="Active" value={stats?.active || 0} subtitle="Currently retained" tone="emerald" icon={ShieldCheck} />
          <StatCard title="Expiring Soon" value={stats?.expiringSoon || 0} subtitle="Within 7 days" tone="amber" icon={CalendarClock} />
          <StatCard title="Expired" value={stats?.expired || 0} subtitle="Retention exceeded" tone="red" icon={AlertTriangle} />
          <StatCard title="High Risk" value={stats?.highRisk || 0} subtitle="Records requiring attention" tone="violet" icon={ShieldAlert} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Retention status distribution</h3>
              <StatusBadge status="ACTIVE" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[10,10,0,0]} fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Risk distribution</h3>
              <BarChart3 className="text-slate-400" size={18} />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskChart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {riskChart.map((entry, index) => (
                      <Cell key={entry.name || index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Data type distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeChart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[10,10,0,0]} fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">ML prediction distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mlChart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#c4b5fd" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Upcoming expirations</h3>
            <div className="space-y-3">
              {(stats?.data?.expiryTimeline || []).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <div className="font-medium text-slate-800">{item.name}</div>
                    <div className="text-sm text-slate-500">{item.expiryDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">{item.daysRemaining} days</div>
                    <StatusBadge status={item.daysRemaining <= 7 ? 'EXPIRING SOON' : 'ACTIVE'} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent system alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 text-amber-800">
                <Clock3 size={16} />
                12 records are expiring within 7 days.
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3 text-red-700">
                <AlertTriangle size={16} />
                5 high-risk records require review.
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-800">
                <Activity size={16} />
                ML prediction completed for recent records.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DashboardPage;
