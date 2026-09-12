export function formatMileage(km) {
  if (km === null || km === undefined || km === '') return '-'
  const n = Number(km)
  return n >= 10000 ? `${(n / 10000).toFixed(2)} 万 km` : `${n} km`
}

export function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}
