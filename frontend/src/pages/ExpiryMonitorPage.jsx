import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getUpcomingExpiry, runExpiryScan } from '../services/api';

function ExpiryMonitorPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await getUpcomingExpiry();
      setRecords(data || []);
    } catch (err) {
      setMessage(err.message || 'Unable to load expiry monitor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleScan = async () => {
    try {
      const { data } = await runExpiryScan();
      setMessage(data.message || 'Expiry scan completed.');
      await loadData();
    } catch (err) {
      setMessage(err.message || 'Expiry scan failed.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Expiry</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Expiry monitor</h1>
          </div>
          <button onClick={handleScan} className="rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700">Run Expiry Scan</button>
        </div>

        {message ? <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-700">{message}</div> : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Record</th>
                <th className="px-4 py-3 font-semibold">Purpose</th>
                <th className="px-4 py-3 font-semibold">Expiry Date</th>
                <th className="px-4 py-3 font-semibold">Days Remaining</th>
                <th className="px-4 py-3 font-semibold">ML Prediction</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
                <th className="px-4 py-3 font-semibold">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Loading expiring records...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No expiring records found.</td></tr>
              ) : records.map((record) => (
                <tr key={record._id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-800">{record.recordId}</td>
                  <td className="px-4 py-3">{record.purpose}</td>
                  <td className="px-4 py-3">{new Date(record.expiryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{Math.ceil((new Date(record.expiryDate) - new Date()) / 86400000)}</td>
                  <td className="px-4 py-3"><StatusBadge status={record.mlPrediction} /></td>
                  <td className="px-4 py-3"><StatusBadge status={record.riskLevel} /></td>
                  <td className="px-4 py-3 text-slate-700">{record.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default ExpiryMonitorPage;
