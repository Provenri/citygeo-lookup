import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { logout, token } = useAuth()
  const [city, setCity] = useState('')
  const [result, setResult] = useState(null)

  const search = async () => {
    const res = await fetch(`/api/geocode?city=${encodeURIComponent(city)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) setResult(data)
    else alert(data.error || 'Search failed')
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">City Geocoder</h1>
        <button onClick={logout} className="text-sm text-red-600">Logout</button>
      </div>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 border p-2 rounded" placeholder="Enter city name" value={city} onChange={e=>setCity(e.target.value)} />
        <button onClick={search} className="bg-blue-600 text-white px-4 rounded">Search</button>
      </div>
      {result && (
        <div className="bg-white p-4 rounded shadow">
          <p><strong>City:</strong> {result.display_name}</p>
          <p><strong>Lat:</strong> {result.lat}, <strong>Lon:</strong> {result.lon}</p>
        </div>
      )}
    </div>
  )
}
