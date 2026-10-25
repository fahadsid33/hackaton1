import { Platform } from 'react-native';

// Default host based on platform
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

let baseUrl = DEFAULT_URL;

export function setApiBaseUrl(url) {
  baseUrl = url.replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  return baseUrl;
}

async function request(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok && response.status !== 422) {
    const err = new Error(data.error || `HTTP error ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const mobileApi = {
  getOffice: () => request('/api/office'),
  getEmployees: () => request('/api/employees'),
  checkIn: (payload) =>
    request('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ ...payload, source: 'mobile' })
    }),
  checkOut: (payload) =>
    request('/api/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ ...payload, source: 'mobile' })
    }),
  getHistory: (employeeId) => request(`/api/attendance/history?employeeId=${encodeURIComponent(employeeId)}`),
  enrollFace: (employeeId, descriptor) =>
    request(`/api/employees/${employeeId}/enroll-face`, {
      method: 'POST',
      body: JSON.stringify({ descriptor })
    }),
  submitCorrection: (correction) =>
    request('/api/corrections', {
      method: 'POST',
      body: JSON.stringify(correction)
    })
};
