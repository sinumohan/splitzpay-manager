import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Funds from './pages/Funds'
import FundDetail from './pages/FundDetail'
import NewFund from './pages/NewFund'
import Auctions from './pages/Auctions'
import Team from './pages/Team'
import MarketplaceConfig from './pages/MarketplaceConfig'
import NotificationsConfig from './pages/NotificationsConfig'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import CreateCompany from './pages/CreateCompany'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/funds" element={<Funds />} />
        <Route path="/funds/new" element={<NewFund />} />
        <Route path="/funds/:id" element={<FundDetail />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/team" element={<Team />} />
        <Route path="/marketplace" element={<MarketplaceConfig />} />
        <Route path="/notifications-config" element={<NotificationsConfig />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-company" element={<CreateCompany />} />
        <Route path="/documents" element={<div className="text-center py-16 text-gray-500">All-funds documents view coming in V0.2</div>} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
