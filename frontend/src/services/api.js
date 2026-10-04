import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

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
export const getHealth = () => api.get('/health');
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecords = (params = {}) => api.get('/records', { params });
export const createRecord = (payload) => api.post('/records', payload);
export const updateRecord = (id, payload) => api.put(`/records/${id}`, payload);
export const deleteRecord = (id) => api.delete(`/records/${id}`);
export const anonymiseRecord = (id) => api.post(`/records/${id}/anonymise`);
export const runExpiryScan = () => api.post('/expiry/scan');
export const getUpcomingExpiry = () => api.get('/expiry/upcoming');
export const getAuditLogs = () => api.get('/audit-logs');
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const getAnalytics = () => api.get('/analytics');
export const getModelEvaluation = () => api.get('/ml/evaluation');
export const predictML = (payload) => api.post('/ml/predict', payload);
export const retrainModel = () => api.post('/ml/retrain');
export const seedDemoData = () => api.post('/seed');
export const runEventSimulation = () => api.post('/demo/event-simulation');

export default api;
