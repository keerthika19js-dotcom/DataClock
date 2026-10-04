import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import { getAnalytics } from '../services/api';

const COLORS = ['#7c3aed', '#0f766e', '#f59e0b', '#dc2626', '#0ea5e9'];

function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await getAnalytics();
      setData(data);
    })();
  }, []);

  if (!data) return <Layout><div className="rounded-2xl bg-white p-6 shadow-soft">Loading analytics...</div></Layout>;

  const statusData = (data.statusCounts || []).map((item) => ({ name: item._id, value: item.count }));
  const riskData = (data.riskCounts || []).map((item) => ({ name: item._id, value: item.count }));
  const typeData = (data.typeCounts || []).map((item) => ({ name: item._id, value: item.count }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Analytics</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Retention analytics</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Retention status</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={statusData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#7c3aed" /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Risk distribution</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskData} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" label>{riskData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Data category distribution</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={typeData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0f766e" /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Insight summary</h3>
            <div className="space-y-3 text-sm text-slate-700">
              {(data.insights || []).map((insight, idx) => (
                <div key={idx} className="rounded-xl bg-slate-50 p-3">{insight}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AnalyticsPage;
