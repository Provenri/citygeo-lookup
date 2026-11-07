import { Routes, Route, Navigate, Link, Outlet, useMatch } from 'react-router-dom'
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

function Layout() {
  const isSearch = useMatch('/search') !== null
  return (
    <div>
      <Nav />
      <div hidden={!isSearch}><Search visible={isSearch} /></div>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/search" element={null} />
          <Route path="/history" element={<History />} />
        </Route>
        <Route path="/" element={<Navigate to="/search" />} />
      </Routes>
    </AuthProvider>
  )
}
