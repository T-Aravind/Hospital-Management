const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function request(endpoint, params = {}, options = {}) {
  const query = new URLSearchParams();
  if (options.method === undefined || options.method === 'GET') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        query.append(key, value);
      }
    });
  }

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const url = `${API_BASE_URL}${endpoint}${queryString}`;

  const fetchOptions = {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (options.body && !(options.body instanceof FormData)) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.detail) errorDetail = errorData.detail;
      } catch (e) {
        // use default errorDetail
      }
      throw new Error(`API Error (${response.status}): ${errorDetail}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`Request failed for ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  getOverview: (params) => request('/api/overview', params),
  getPatients: (params) => request('/api/patients', params),
  getAdmissions: (params) => request('/api/admissions', params),
  getBeds: (params) => request('/api/beds', params),
  getDoctors: (params) => request('/api/doctors', params),
  getTreatments: (params) => request('/api/treatments', params),
  getBilling: (params) => request('/api/billing', params),
  getMetadata: () => request('/api/metadata'),
  getHealth: () => request('/api/health'),

  // Hospital & Database Management
  getHospitals: () => request('/api/hospitals'),
  getActiveHospital: () => request('/api/hospitals/active'),
  switchHospital: (hospital_id) => request('/api/hospitals/switch', {}, { method: 'POST', body: { hospital_id } }),
  createHospital: (data) => request('/api/hospitals', {}, { method: 'POST', body: data }),
  testDbConnection: (data) => request('/api/hospitals/test-db', {}, { method: 'POST', body: data }),
  connectHospitalDb: (hospital_id, data) => request(`/api/hospitals/${hospital_id}/connect-db`, {}, { method: 'POST', body: data }),
  uploadHospitalData: (hospital_id, formData) => request(`/api/hospitals/${hospital_id}/upload-data`, {}, { method: 'POST', body: formData }),
};
