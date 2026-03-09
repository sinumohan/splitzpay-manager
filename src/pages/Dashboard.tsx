import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChitFund, Auction } from '../types'
import { CreditCard, Users, Gavel, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const { activeCompany } = useAuth()
  const [funds, setFunds] = useState<ChitFund[]>([])
  const [upcomingAuctions, setUpcomingAuctions] = useState<Auction[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, members: 0, auctions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!activeCompany) return
      const [{ data: fundsData }, { data: auctionsData }] = await Promise.all([
        supabase
          .from('chit_funds')
          .select('*, fund_members(count)')
          .eq('company_id', activeCompany.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('auctions')
          .select('*, chit_funds!inner(name, company_id)')
          .eq('chit_funds.company_id', activeCompany.id)
          .in('status', ['scheduled', 'active'])
          .order('scheduled_at', { ascending: true })
          .limit(5),
      ])
      const f = fundsData || []
      setFunds(f)
      setUpcomingAuctions(auctionsData || [])
      setStats({
        total: f.length,
        active: f.filter(x => x.status === 'active').length,
        members: f.reduce((sum, x) => sum + ((x.fund_members as any)?.[0]?.count || 0), 0),
        auctions: (auctionsData || []).length,
      })
      setLoading(false)
    }
    if (activeCompany) load()
    else setLoading(false)
  }, [activeCompany?.id])

  if (!loading && !activeCompany) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-brand-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">No Company Yet</h2>
        <p className="text-gray-500 mt-2">Create a company to start managing chit funds.</p>
        <Link to="/create-company" className="btn-primary inline-flex mt-4">Create Company</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{activeCompany?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Funds', value: stats.total, icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
          { label: 'Active Funds', value: stats.active, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Total Members', value: stats.members, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Upcoming Auctions', value: stats.auctions, icon: Gavel, color: 'text-orange-600 bg-orange-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Funds</h2>
            <Link to="/funds" className="text-sm text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {funds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No funds yet</p>
              <Link to="/funds/new" className="text-brand-600 text-sm">Create your first fund</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {funds.map(f => (
                <Link key={f.id} to={`/funds/${f.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{f.name}</p>
                    <p className="text-xs text-gray-500">
                      {(f.fund_members as any)?.[0]?.count || 0}/{f.max_members} members
                    </p>
                  </div>
                  <span className={`badge ${f.status === 'active' ? 'badge-green' : f.status === 'draft' ? 'badge-yellow' : 'badge-gray'}`}>
                    {f.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Auctions</h2>
            <Link to="/auctions" className="text-sm text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingAuctions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gavel className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No upcoming auctions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingAuctions.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{(a.chit_funds as any)?.name}</p>
                    <p className="text-xs text-gray-500">Month {a.month_number}</p>
                  </div>
                  <span className={`badge ${a.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
