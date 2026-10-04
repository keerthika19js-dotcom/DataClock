import axios from 'axios';
import {
  anonymiseDemoRecord,
  createDemoRecord,
  deleteDemoRecord,
  demoModelEvaluation,
  getDemoAnalytics,
  getDemoAuditLogs,
  getDemoDashboardStats,
  getDemoEventSimulation,
  getDemoNotifications,
  getDemoRecords,
  getDemoUpcomingExpiry,
  markDemoNotificationRead,
  resetDemoState,
  scanDemoExpiry,
  updateDemoRecord,
} from './demoData';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  },
);

export const loginDemo = (email, password) => api.post('/auth/demo-login', { email, password });
const demoResponse = (data) => Promise.resolve({ data });

function toModelPayload(payload) {
  const now = Date.now();
  const collectionDate = payload.collectionDate ? new Date(payload.collectionDate).getTime() : now;
  const lastAccessDate = payload.lastAccessDate ? new Date(payload.lastAccessDate).getTime() : now;
  return {
    data_type: payload.dataCategory || payload.dataType || 'Other',
    sensitivity: Number(payload.sensitivity || 3),
    purpose: payload.purpose || 'Other',
    data_age_days: Math.max(0, Math.floor((now - collectionDate) / 86400000)),
    days_since_last_access: Math.max(0, Math.floor((now - lastAccessDate) / 86400000)),
    usage_frequency: payload.usageFrequency || 'Low',
    purpose_completed: Boolean(payload.purposeCompleted),
    retention_period_days: Number(payload.retentionPeriodDays || 30),
    policy_type: payload.policyType || 'Temporary',
    risk_score: 0,
  };
}

export const getHealth = () => DEMO_MODE
  ? demoResponse({ status: 'ok', database: 'browser-demo', message: 'Using synthetic data stored in this browser.' })
  : api.get('/health');
export const getDashboardStats = () => DEMO_MODE ? demoResponse(getDemoDashboardStats()) : api.get('/dashboard/stats');
export const getRecords = (params = {}) => DEMO_MODE ? demoResponse(getDemoRecords(params)) : api.get('/records', { params });
export const createRecord = async (payload) => {
  if (!DEMO_MODE) return api.post('/records', payload);
  let prediction;
  try {
    ({ data: prediction } = await api.post('/ml/predict', toModelPayload(payload)));
  } catch {
    prediction = null;
  }
  return demoResponse(createDemoRecord(payload, prediction));
};
export const updateRecord = (id, payload) => DEMO_MODE ? demoResponse(updateDemoRecord(id, payload)) : api.put(`/records/${id}`, payload);
export const deleteRecord = (id) => DEMO_MODE ? demoResponse(deleteDemoRecord(id)) : api.delete(`/records/${id}`);
export const anonymiseRecord = (id) => DEMO_MODE ? demoResponse(anonymiseDemoRecord(id)) : api.post(`/records/${id}/anonymise`);
export const runExpiryScan = () => DEMO_MODE ? demoResponse(scanDemoExpiry()) : api.post('/expiry/scan');
export const getUpcomingExpiry = () => DEMO_MODE ? demoResponse(getDemoUpcomingExpiry()) : api.get('/expiry/upcoming');
export const getAuditLogs = () => DEMO_MODE ? demoResponse(getDemoAuditLogs()) : api.get('/audit-logs');
export const getNotifications = () => DEMO_MODE ? demoResponse(getDemoNotifications()) : api.get('/notifications');
export const markNotificationRead = (id) => DEMO_MODE ? demoResponse(markDemoNotificationRead(id)) : api.put(`/notifications/${id}/read`);
export const getAnalytics = () => DEMO_MODE ? demoResponse(getDemoAnalytics()) : api.get('/analytics');
export const getModelEvaluation = () => DEMO_MODE ? demoResponse(demoModelEvaluation) : api.get('/ml/evaluation');
export const predictML = (payload) => api.post('/ml/predict', payload);
export const retrainModel = () => api.post('/ml/retrain');
export const seedDemoData = () => DEMO_MODE
  ? demoResponse({ success: true, insertedCount: resetDemoState().records.length, message: 'Synthetic demo data loaded in this browser.' })
  : api.post('/seed');
export const runEventSimulation = () => DEMO_MODE ? demoResponse(getDemoEventSimulation()) : api.post('/demo/event-simulation');

export default api;
