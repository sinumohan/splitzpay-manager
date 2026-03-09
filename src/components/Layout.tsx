import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, CreditCard, Gavel, FileText,
  Bell, Settings, LogOut, ChevronDown, Building2, Menu, Store
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const managerNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/funds', label: 'Funds', icon: CreditCard },
  { path: '/auctions', label: 'Auctions', icon: Gavel },
  { path: '/documents', label: 'Documents', icon: FileText },
]

const adminNav = [
  ...managerNav,
  { path: '/team', label: 'Team', icon: Users },
  { path: '/marketplace', label: 'Marketplace', icon: Store },
  { path: '/notifications-config', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const { profile, companies, activeCompany, companyRole, setActiveCompany, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [companyDropdown, setCompanyDropdown] = useState(false)

  const navItems = companyRole === 'admin' ? adminNav : managerNav

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-gray-900">SplitzPay</span>
          {companyRole && (
            <span className="badge badge-purple ml-auto capitalize">{companyRole}</span>
          )}
        </div>

        {/* Company Switcher */}
        {companies.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 relative">
            <button
              onClick={() => setCompanyDropdown(!companyDropdown)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activeCompany?.name || 'Select company'}</p>
                <p className="text-xs text-gray-500">Active company</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
            {companyDropdown && (
              <div className="absolute left-4 right-4 top-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                {companies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCompany(c); setCompanyDropdown(false) }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${activeCompany?.id === c.id ? 'text-brand-600 font-medium' : 'text-gray-700'}`}
                  >
                    {c.name}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <Link
                    to="/create-company"
                    onClick={() => setCompanyDropdown(false)}
                    className="block px-3 py-2 text-sm text-brand-600 hover:bg-brand-50"
                  >
                    + Create new company
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === path || location.pathname.startsWith(path + '/')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-600">
            <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center">
              <span className="text-brand-700 text-xs font-bold">{profile?.full_name?.[0] || 'U'}</span>
            </div>
            <span className="truncate">{profile?.full_name || 'Profile'}</span>
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">SplitzPay Manager</span>
        </header>
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
