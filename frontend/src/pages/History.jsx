import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getHistory } from '../services/api.js'

export default function HistoryPage() {
  const { token } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    getHistory(token)
      .then(setHistory)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="p-6">Loading history...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Search History</h1>
      {history.length === 0 ? (
        <p>No searches yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">City</th>
              <th className="text-left p-3">Country</th>
              <th className="text-left p-3">Lat</th>
              <th className="text-left p-3">Lon</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} className="border-b">
                <td className="p-3">{h.city}</td>
                <td className="p-3">{h.country || '-'}</td>
                <td className="p-3">{h.lat}</td>
                <td className="p-3">{h.lon}</td>
                <td className="p-3">{new Date(h.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
