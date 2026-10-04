import { useState } from 'react';
import Layout from '../components/Layout';
import { createRecord } from '../services/api';

const initialForm = {
  dataType: 'Identity',
  dataCategory: 'ID Proof',
  purpose: 'Verification',
  sensitivity: 5,
  collectionDate: new Date().toISOString().slice(0, 10),
  lastAccessDate: new Date().toISOString().slice(0, 10),
  usageFrequency: 'Low',
  purposeCompleted: true,
  retentionPeriodDays: 30,
  policyType: 'Temporary',
  organizationPolicy: 'Retention aligned with event verification and compliance review.',
};

function AddRecordPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await createRecord(form);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to create record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Add data</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Add data record</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Data Type</label>
                <select value={form.dataType} onChange={(e) => onChange('dataType', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none">
                  <option>Identity</option>
                  <option>Contact</option>
                  <option>Financial</option>
                  <option>Location</option>
                  <option>Academic</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Data Category</label>
                <input value={form.dataCategory} onChange={(e) => onChange('dataCategory', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Purpose</label>
                <select value={form.purpose} onChange={(e) => onChange('purpose', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none">
                  <option>Verification</option>
                  <option>Registration</option>
                  <option>Communication</option>
                  <option>Navigation</option>
                  <option>Payment</option>
                  <option>Academic</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Sensitivity</label>
                <select value={form.sensitivity} onChange={(e) => onChange('sensitivity', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none">
                  <option value={1}>1 - Low</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5 - Very High</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Collection Date</label>
                <input type="date" value={form.collectionDate} onChange={(e) => onChange('collectionDate', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Last Access Date</label>
                <input type="date" value={form.lastAccessDate} onChange={(e) => onChange('lastAccessDate', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Usage Frequency</label>
                <select value={form.usageFrequency} onChange={(e) => onChange('usageFrequency', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none">
                  <option>None</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Purpose Completed</label>
                <select value={form.purposeCompleted} onChange={(e) => onChange('purposeCompleted', e.target.value === 'true')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none">
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Retention Period Days</label>
                <input type="number" value={form.retentionPeriodDays} onChange={(e) => onChange('retentionPeriodDays', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Policy Type</label>
                <input value={form.policyType} onChange={(e) => onChange('policyType', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1 block text-sm font-medium text-slate-700">Organization Policy</label>
              <textarea value={form.organizationPolicy} onChange={(e) => onChange('organizationPolicy', e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" />
            </div>

            <button type="submit" disabled={loading} className="mt-6 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
              {loading ? 'Submitting...' : 'Submit Record'}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Prediction Result</h3>
            {error ? <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            {result ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Prediction</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{result.record.mlPrediction}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p><strong>Confidence:</strong> {(result.prediction.confidence * 100).toFixed(0)}%</p>
                  <p><strong>Risk:</strong> {result.record.riskLevel}</p>
                  <p><strong>Recommended Action:</strong> {result.record.recommendedAction}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No prediction yet. Submit a record to generate a live ML assessment.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AddRecordPage;
