import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { register as registerRequest } from '../services/api.js'

export default function Register() {
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
      const token = await registerRequest(username, password)
      login(token)
      navigate('/search')
    } catch (requestError) {
      setError(requestError.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80 space-y-4">
        <h1 className="text-xl font-bold">Register</h1>
        <input className="w-full border p-2 rounded" placeholder="Username" autoComplete="username" required value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Password" autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <button disabled={submitting} className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-60">{submitting ? 'Creating account...' : 'Register'}</button>
        <p className="text-sm">Have account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </form>
    </div>
  )
}
