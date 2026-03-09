import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChitFund } from '../types'
import { Plus, Copy, CreditCard, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Funds() {
  const { activeCompany } = useAuth()
  const [funds, setFunds] = useState<ChitFund[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadFunds = async () => {
    if (!activeCompany) return
    const { data } = await supabase
      .from('chit_funds')
      .select('*, fund_members(count)')
      .eq('company_id', activeCompany.id)
      .order('created_at', { ascending: false })
    setFunds(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadFunds()
  }, [activeCompany?.id])

  const handleDuplicate = async (fund: ChitFund) => {
    const name = `${fund.name} (Copy)`
    try {
      const { data: newFundId, error } = await supabase.rpc('duplicate_chit_fund', {
        source_fund_id: fund.id,
        new_name: name,
        include_members: false,
      })
      if (error) throw error
      const { data: newFund } = await supabase.from('chit_funds').select('*, fund_members(count)').eq('id', newFundId).single()
      if (newFund) setFunds(prev => [newFund, ...prev])
      toast.success('Fund duplicated!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Duplicate failed')
    }
  }

  const filtered = funds.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chit Funds</h1>
        <Link to="/funds/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Fund
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search funds..."
          className="input pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{search ? 'No funds match your search' : 'No funds yet'}</p>
          {!search && <Link to="/funds/new" className="btn-primary inline-flex mt-4">Create First Fund</Link>}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header">Fund Name</th>
                <th className="table-header hidden sm:table-cell">Monthly</th>
                <th className="table-header hidden md:table-cell">Members</th>
                <th className="table-header hidden lg:table-cell">Duration</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <Link to={`/funds/${f.id}`} className="font-medium text-brand-600 hover:text-brand-700">{f.name}</Link>
                    {f.description && <p className="text-xs text-gray-400 truncate max-w-xs">{f.description}</p>}
                  </td>
                  <td className="table-cell hidden sm:table-cell">₹{f.monthly_amount.toLocaleString()}</td>
                  <td className="table-cell hidden md:table-cell">
                    {(f.fund_members as any)?.[0]?.count || 0}/{f.max_members}
                  </td>
                  <td className="table-cell hidden lg:table-cell">{f.duration_months}m</td>
                  <td className="table-cell">
                    <span className={`badge ${
                      f.status === 'active' ? 'badge-green' :
                      f.status === 'draft' ? 'badge-yellow' :
                      f.status === 'completed' ? 'badge-blue' : 'badge-red'
                    }`}>{f.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Link to={`/funds/${f.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium">Manage</Link>
                      <button onClick={() => handleDuplicate(f)} className="text-gray-400 hover:text-gray-600" title="Duplicate fund">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
