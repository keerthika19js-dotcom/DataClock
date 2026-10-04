import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAuditLogs } from '../services/api';

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await getAuditLogs();
      setLogs(data || []);
    })();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Audit</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Audit logs</h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Record ID</th>
                <th className="px-4 py-3 font-semibold">Previous Status</th>
                <th className="px-4 py-3 font-semibold">New Status</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">{log.admin}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.recordId}</td>
                  <td className="px-4 py-3">{log.previousStatus}</td>
                  <td className="px-4 py-3">{log.newStatus}</td>
                  <td className="px-4 py-3 text-slate-600">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default AuditLogsPage;
