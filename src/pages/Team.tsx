import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CompanyMember } from '../types'
import { Shield, UserCog, Users, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Team() {
  const { activeCompany, user, companyRole } = useAuth()
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!activeCompany) return
      const { data } = await supabase
        .from('company_members')
        .select('*, profiles(full_name, phone)')
        .eq('company_id', activeCompany.id)
        .order('joined_at')
      setMembers(data || [])
      setLoading(false)
    }
    load()
  }, [activeCompany?.id])

  const changeRole = async (memberId: string, newRole: 'admin' | 'manager' | 'member') => {
    if (companyRole !== 'admin') { toast.error('Only admins can change roles'); return }
    const { error } = await supabase.from('company_members').update({ role: newRole }).eq('id', memberId)
    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      toast.success(`Role updated to ${newRole}`)
      setOpenMenu(null)
    }
  }

  const roleIcon = { admin: Shield, manager: UserCog, member: Users }
  const roleColors: Record<string, string> = { admin: 'badge-purple', manager: 'badge-blue', member: 'badge-gray' }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team Management</h1>
      <p className="text-gray-500 -mt-4">
        Manage roles for <strong>{activeCompany?.name}</strong>.
        Company Admins can make users Fund Managers and assign them to specific funds.
      </p>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="table-header">Member</th>
              <th className="table-header hidden sm:table-cell">Phone</th>
              <th className="table-header">Role</th>
              {companyRole === 'admin' && <th className="table-header">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : members.map(m => {
              const RoleIcon = roleIcon[m.role]
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-600 font-bold text-sm">
                          {(m.profiles as any)?.full_name?.[0] || 'U'}
                        </span>
                      </div>
                      <span className="font-medium">{(m.profiles as any)?.full_name || 'Unknown'}</span>
                      {m.user_id === user?.id && <span className="badge badge-gray text-xs">You</span>}
                    </div>
                  </td>
                  <td className="table-cell hidden sm:table-cell text-gray-500">
                    {(m.profiles as any)?.phone || '-'}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${roleColors[m.role]} flex items-center gap-1 w-fit`}>
                      <RoleIcon className="w-3 h-3" />
                      {m.role}
                    </span>
                  </td>
                  {companyRole === 'admin' && (
                    <td className="table-cell relative">
                      {m.user_id !== user?.id && (
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded"
                          >
                            Change <ChevronDown className="w-3 h-3" />
                          </button>
                          {openMenu === m.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-10">
                              {(['admin', 'manager', 'member'] as const).map(role => (
                                <button
                                  key={role}
                                  onClick={() => changeRole(m.id, role)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 capitalize ${m.role === role ? 'text-brand-600 font-medium' : 'text-gray-700'}`}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
