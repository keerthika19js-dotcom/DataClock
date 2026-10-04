import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginDemo } from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@dataclock.demo');
  const [password, setPassword] = useState('dataclock123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await loginDemo(email, password);
      localStorage.setItem('dataclock-user', JSON.stringify(data.user));
      localStorage.setItem('dataclock-token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@dataclock.demo');
    setPassword('dataclock123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-indigo-100 p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-gradient-to-br from-indigo-950 via-violet-900 to-indigo-900 p-10 text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-2xl font-bold">D</div>
            <div>
              <h1 className="text-3xl font-bold">DataClock</h1>
              <p className="text-violet-200">Automated Personal Data Expiry Tracking</p>
            </div>
          </div>

          <h2 className="mb-4 text-4xl font-bold">Privacy-aware retention management</h2>
          <p className="max-w-md text-violet-100">
            A machine learning prototype for purpose-aware personal data retention prediction, expiry monitoring, and audit-driven governance.
          </p>
        </div>

        <div className="p-10">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-violet-600">Secure access</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">Administrator login</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-violet-300"
                placeholder="admin@dataclock.demo"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-violet-300"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button type="button" onClick={fillDemo} className="w-full rounded-xl border border-violet-200 bg-violet-50 py-3 font-semibold text-violet-700 transition hover:bg-violet-100">
              Demo Login
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Demo credentials: admin@dataclock.demo / dataclock123
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
