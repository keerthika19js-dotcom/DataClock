import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import AddRecordPage from './pages/AddRecordPage';
import MLPredictionsPage from './pages/MLPredictionsPage';
import ExpiryMonitorPage from './pages/ExpiryMonitorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import EventDemoPage from './pages/EventDemoPage';

function ProtectedRoute({ children }) {
  const user = localStorage.getItem('dataclock-user');
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
        <Route path="/add-record" element={<ProtectedRoute><AddRecordPage /></ProtectedRoute>} />
        <Route path="/ml-predictions" element={<ProtectedRoute><MLPredictionsPage /></ProtectedRoute>} />
        <Route path="/expiry-monitor" element={<ProtectedRoute><ExpiryMonitorPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/demo/event-registration" element={<ProtectedRoute><EventDemoPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
