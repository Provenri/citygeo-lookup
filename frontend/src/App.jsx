import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Search from './pages/Search.jsx'
import History from './pages/History.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

function Nav() {
  const { logout } = useAuth()
  return (
    <nav className="p-4 border-b flex gap-4 items-center">
      <Link to="/search" className="font-semibold">Search</Link>
      <Link to="/history" className="font-semibold">History</Link>
      <button onClick={logout} className="ml-auto text-sm text-red-600">Logout</button>
    </nav>
  )
}

function Layout({ children }) {
  return (
    <div>
      <Nav />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Layout><Search /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout><History /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/search" />} />
      </Routes>
    </AuthProvider>
  )
}
