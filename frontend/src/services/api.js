const API_BASE = '/api'

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data.token
}

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Register failed')
  return true
}

export async function geocodeSearch(city, token) {
  const res = await fetch(`${API_BASE}/geocode?city=${encodeURIComponent(city)}`, {
    headers: { ...authHeaders(token) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Search failed')
  return data
}

export async function getHistory(token) {
  const res = await fetch(`${API_BASE}/geocode/history`, {
    headers: { ...authHeaders(token) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'History fetch failed')
  return data
}
