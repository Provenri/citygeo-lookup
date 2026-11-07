import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { geocodeSearch } from '../services/api.js'

export default function SearchPage() {
  const { token } = useAuth()
  const [city, setCity] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setError('')
    setResult(null)
    if (!city.trim()) { setError('Enter a city name'); return }
    setLoading(true)
    try {
      const data = await geocodeSearch(city, token)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">City Geocoder</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Enter city name"
          maxLength={120}
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button onClick={search} disabled={loading} className="bg-blue-600 text-white px-4 rounded">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {result && (
        <div className="bg-white p-4 rounded shadow">
          <p><strong>City:</strong> {result.display_name}</p>
          <p><strong>Lat:</strong> {result.lat}, <strong>Lon:</strong> {result.lon}</p>
          <p><strong>Country:</strong> {result.country || '-'}</p>
          <a
            className="inline-block mt-3 text-blue-700 underline"
            href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=12/${result.lat}/${result.lon}`}
            target="_blank"
            rel="noreferrer"
          >
            View on OpenStreetMap
          </a>
        </div>
      )}
    </div>
  )
}
