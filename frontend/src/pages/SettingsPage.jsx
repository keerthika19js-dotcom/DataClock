import { useState } from 'react';
import Layout from '../components/Layout';
import { retrainModel, seedDemoData } from '../services/api';

function SettingsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRetrain = async () => {
    setLoading(true);
    try {
      const { data } = await retrainModel();
      setMessage(data.message || 'Model retraining completed.');
    } catch (err) {
      setMessage(err.message || 'Retraining failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Settings</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">System configuration</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Demo data</h3>
            <p className="mt-2 text-sm text-slate-600">Load synthetic records into MongoDB for demonstration and testing.</p>
            <button onClick={() => seedDemoData().then(({ data }) => setMessage(data.message)).catch((e) => setMessage(e.message))} className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700">Load Demo Data</button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Model training</h3>
            <p className="mt-2 text-sm text-slate-600">Retrain the logistic regression, decision tree, and random forest models from the synthetic dataset.</p>
            <button onClick={handleRetrain} disabled={loading} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? 'Training...' : 'Retrain Model'}</button>
          </div>
        </div>

        {message ? <div className="rounded-xl bg-violet-50 p-4 text-sm text-violet-700">{message}</div> : null}
      </div>
    </Layout>
  );
}

export default SettingsPage;
