const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function request(endpoint, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      query.append(key, value);
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const url = `${API_BASE_URL}${endpoint}${queryString}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${response.statusText}`);
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
};
