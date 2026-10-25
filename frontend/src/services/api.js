const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok && response.status !== 422) {
    // 422 is our domain-level validation rejection (e.g. out of geofence), handled cleanly by caller
    const err = new Error(data.error || `HTTP error ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Office settings
  getOffice: () => request('/office'),
  updateOffice: (settings) => request('/office', { method: 'PUT', body: JSON.stringify(settings) }),
  testGeofence: (coords) => request('/office/test-geofence', { method: 'POST', body: JSON.stringify(coords) }),

  // Employees
  getEmployees: () => request('/employees'),
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (emp) => request('/employees', { method: 'POST', body: JSON.stringify(emp) }),
  enrollFace: (id, descriptor) =>
    request(`/employees/${id}/enroll-face`, {
      method: 'POST',
      body: JSON.stringify({ descriptor })
    }),

  // Attendance
  checkIn: (payload) =>
    request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  checkOut: (payload) =>
    request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getTodayAttendance: (employeeId) => request(`/attendance/today?employeeId=${encodeURIComponent(employeeId)}`),
  getHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/attendance/history?${qs}`);
  },
  getStats: () => request('/attendance/stats'),

  // HR Corrections
  getCorrections: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/corrections?${qs}`);
  },
  submitCorrection: (correction) =>
    request('/corrections', {
      method: 'POST',
      body: JSON.stringify(correction)
    }),
  reviewCorrection: (id, reviewData) =>
    request(`/corrections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData)
    })
};
