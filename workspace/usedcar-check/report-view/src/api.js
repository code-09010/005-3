const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body instanceof FormData
      ? {}
      : { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = `请求失败 (${res.status})`
    try {
      const data = await res.json()
      detail =
        data.detail ||
        (typeof data === 'object' ? Object.entries(data).map(([k, v]) =>
          `${k}: ${Array.isArray(v) ? v.join('，') : v}`).join('；') : detail)
    } catch {
      /* ignore */
    }
    const error = new Error(detail)
    error.status = res.status
    throw error
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  listItems: () => request('/items/'),

  listReports: () => request('/reports/'),
  getReport: (id) => request(`/reports/${id}/`),
  createReport: (payload) =>
    request('/reports/', { method: 'POST', body: JSON.stringify(payload) }),
  updateReport: (id, payload) =>
    request(`/reports/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReport: (id) => request(`/reports/${id}/`, { method: 'DELETE' }),

  compareReports: (ids) => request(`/reports/compare?ids=${ids.join(',')}`),

  uploadPhoto: (reportItemId, file, caption = '') => {
    const form = new FormData()
    form.append('report_item', reportItemId)
    form.append('image', file)
    if (caption) form.append('caption', caption)
    return request('/photos/', { method: 'POST', body: form })
  },

  deletePhoto: (id) => request(`/photos/${id}/`, { method: 'DELETE' }),
}
