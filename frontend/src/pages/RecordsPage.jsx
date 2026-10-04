import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { getRecords } from '../services/api';

const tableHeaders = ['Record ID', 'Data Type', 'Purpose', 'Sensitivity', 'Risk', 'ML Prediction', 'Status', 'Actions'];

function RecordsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', status: '', dataType: '', purpose: '', riskLevel: '', prediction: '' });
  const [page, setPage] = useState(1);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await getRecords({ ...filters, page, limit: 20 });
      setRows(data.records || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [filters, page]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Records</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Data records</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Search</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} className="w-full bg-transparent text-sm outline-none" placeholder="Record ID, type or purpose" />
              </div>
            </div>
            <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
              <option value="">Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <select value={filters.dataType} onChange={(e) => setFilters((prev) => ({ ...prev, dataType: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
              <option value="">Data Type</option>
              <option value="Identity">Identity</option>
              <option value="Contact">Contact</option>
              <option value="Financial">Financial</option>
              <option value="Location">Location</option>
              <option value="Academic">Academic</option>
            </select>
            <select value={filters.purpose} onChange={(e) => setFilters((prev) => ({ ...prev, purpose: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
              <option value="">Purpose</option>
              <option value="Verification">Verification</option>
              <option value="Registration">Registration</option>
              <option value="Communication">Communication</option>
              <option value="Navigation">Navigation</option>
              <option value="Payment">Payment</option>
            </select>
            <select value={filters.prediction} onChange={(e) => setFilters((prev) => ({ ...prev, prediction: e.target.value }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none">
              <option value="">Prediction</option>
              <option value="RETAIN">Retain</option>
              <option value="REVIEW">Review</option>
              <option value="EXPIRE">Expire</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">Loading records...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No records found.</td></tr>
                ) : rows.map((record) => (
                  <tr key={record._id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{record.recordId}</td>
                    <td className="px-4 py-3">{record.dataType}</td>
                    <td className="px-4 py-3">{record.purpose}</td>
                    <td className="px-4 py-3">{record.sensitivity}</td>
                    <td className="px-4 py-3">{record.riskScore}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.mlPrediction} type="status" /></td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} type="status" /></td>
                    <td className="px-4 py-3">
                      <button className="text-violet-700 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default RecordsPage;
