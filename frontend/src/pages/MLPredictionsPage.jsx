import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Layout from '../components/Layout';
import { getModelEvaluation, predictML } from '../services/api';

function MLPredictionsPage() {
  const [metrics, setMetrics] = useState(null);
  const [payload, setPayload] = useState({
    data_type: 'ID Proof',
    sensitivity: 5,
    purpose: 'Verification',
    data_age_days: 45,
    days_since_last_access: 30,
    usage_frequency: 'Low',
    purpose_completed: true,
    retention_period_days: 30,
    policy_type: 'Temporary',
  });
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getModelEvaluation();
        setMetrics(data);
      } catch (err) {
        setError(err.message || 'Model evaluation unavailable.');
      }
    })();
  }, []);

  const handlePredict = async () => {
    try {
      const { data } = await predictML(payload);
      setPrediction(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Prediction failed.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-600">ML</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Model evaluation and prediction</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Model Comparison</h3>
            {metrics ? (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Best model</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{metrics.best_model}</p>
                </div>
                {Object.entries(metrics.results || {}).map(([model, values]) => (
                  <div key={model} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{model}</span>
                      <span className="text-violet-700">F1: {values.f1_score}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <span>Accuracy: {values.accuracy}</span>
                      <span>Precision: {values.precision}</span>
                      <span>Recall: {values.recall}</span>
                      <span>CV: {values.cv_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-slate-500">Loading model metrics…</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Live prediction</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={payload.data_type} onChange={(e) => setPayload({ ...payload, data_type: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" placeholder="Data type" />
              <input type="number" value={payload.sensitivity} onChange={(e) => setPayload({ ...payload, sensitivity: Number(e.target.value) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" placeholder="Sensitivity" />
              <input value={payload.purpose} onChange={(e) => setPayload({ ...payload, purpose: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" placeholder="Purpose" />
              <input type="number" value={payload.data_age_days} onChange={(e) => setPayload({ ...payload, data_age_days: Number(e.target.value) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              <input type="number" value={payload.days_since_last_access} onChange={(e) => setPayload({ ...payload, days_since_last_access: Number(e.target.value) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              <input value={payload.usage_frequency} onChange={(e) => setPayload({ ...payload, usage_frequency: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              <input type="number" value={payload.retention_period_days} onChange={(e) => setPayload({ ...payload, retention_period_days: Number(e.target.value) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              <input value={payload.policy_type} onChange={(e) => setPayload({ ...payload, policy_type: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
            </div>
            <button onClick={handlePredict} className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 font-medium text-white">Predict</button>
            {error ? <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            {prediction ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Prediction</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{prediction.prediction}</p>
                <p className="mt-2">Confidence: {(prediction.confidence * 100).toFixed(0)}%</p>
                <p>Risk: {prediction.risk_level}</p>
                <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                  <p className="font-semibold text-violet-700">Why this prediction?</p>
                  <p className="mt-2 text-violet-800">Purpose completion, age, and sensitivity strongly influence the decision. Final prediction is generated by the ML model.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MLPredictionsPage;
