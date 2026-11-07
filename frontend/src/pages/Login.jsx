import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { login as loginRequest } from '../services/api.js'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const token = await loginRequest(username, password)
      login(token)
      navigate('/search')
    } catch (requestError) {
      setError(requestError.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80 space-y-4">
        <h1 className="text-xl font-bold">Login</h1>
        <input className="w-full border p-2 rounded" placeholder="Username" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <button disabled={submitting} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-60">{submitting ? 'Signing in...' : 'Login'}</button>
        <p className="text-sm">No account? <Link to="/register" className="text-blue-600">Register</Link></p>
      </form>
    </div>
  )
}
