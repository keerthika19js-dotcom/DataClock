import { useState } from 'react';
import Layout from '../components/Layout';
import { runEventSimulation } from '../services/api';

function EventDemoPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const { data } = await runEventSimulation();
      setResult(data);
    } catch (err) {
      setResult({ message: err.message || 'Simulation failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Demo</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">College event registration scenario</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-slate-600">500 students registered for a college event. Their verification, contact, and ID records were analyzed to assess retention risk and expiry review priority.</p>
          <button onClick={handleSimulate} disabled={loading} className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700 disabled:opacity-60">
            {loading ? 'Running analysis...' : 'Run College Event Expiry Simulation'}
          </button>

          {result ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="text-lg font-semibold text-slate-900">Result</p>
              <p className="mt-2">{result.totalAnalyzed || 0} records analyzed.</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">Retain: {result.counts?.RETAIN || 0}</div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-800">Review: {result.counts?.REVIEW || 0}</div>
                <div className="rounded-xl bg-red-50 p-3 text-red-800">Expire: {result.counts?.EXPIRE || 0}</div>
              </div>
              <p className="mt-4 text-violet-700">{result.message || 'Purpose completed verification records are prioritized for expiry review.'}</p>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}

export default EventDemoPage;
