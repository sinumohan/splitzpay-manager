import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Auction } from '../types'

type FundOption = { id: string; name: string }
import { Gavel, Plus, Calendar, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Auctions() {
  const { activeCompany, user } = useAuth()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [funds, setFunds] = useState<FundOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newAuction, setNewAuction] = useState({ fund_id: '', month_number: 1, scheduled_at: '' })

  useEffect(() => {
    const load = async () => {
      if (!activeCompany) return
      const [{ data: fundsData }, { data: auctionsData }] = await Promise.all([
        supabase.from('chit_funds').select('id, name').eq('company_id', activeCompany.id).eq('status', 'active'),
        supabase
          .from('auctions')
          .select('*, chit_funds!inner(name, company_id), auction_bids(count), auction_winners(*)')
          .eq('chit_funds.company_id', activeCompany.id)
          .order('created_at', { ascending: false }),
      ])
      setFunds(fundsData || [])
      setAuctions(auctionsData || [])
      setLoading(false)
    }
    load()
  }, [activeCompany?.id])

  const createAuction = async () => {
    if (!newAuction.fund_id || !user) return
    try {
      const { data, error } = await supabase
        .from('auctions')
        .insert({
          fund_id: newAuction.fund_id,
          month_number: newAuction.month_number,
          scheduled_at: newAuction.scheduled_at || null,
          status: 'scheduled',
          created_by: user.id,
        })
        .select('*, chit_funds(name)')
        .single()
      if (error) throw error
      setAuctions(prev => [data, ...prev])
      setShowCreate(false)
      toast.success('Auction scheduled!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule auction')
    }
  }

  const startAuction = async (auctionId: string) => {
    await supabase.from('auctions').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', auctionId)
    setAuctions(prev => prev.map(a => a.id === auctionId ? { ...a, status: 'active' as const } : a))
    toast.success('Auction started!')
  }

  const statusConfig = {
    scheduled: { badge: 'badge-yellow', label: 'Scheduled' },
    active: { badge: 'badge-green', label: 'Active' },
    completed: { badge: 'badge-blue', label: 'Completed' },
    cancelled: { badge: 'badge-red', label: 'Cancelled' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auctions</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Schedule Auction
        </button>
      </div>

      {showCreate && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Schedule New Auction</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fund *</label>
              <select
                value={newAuction.fund_id}
                onChange={e => setNewAuction(prev => ({ ...prev, fund_id: e.target.value }))}
                className="input"
              >
                <option value="">Select fund...</option>
                {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month Number *</label>
              <input
                type="number"
                min={1}
                value={newAuction.month_number}
                onChange={e => setNewAuction(prev => ({ ...prev, month_number: +e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Date</label>
              <input
                type="datetime-local"
                value={newAuction.scheduled_at}
                onChange={e => setNewAuction(prev => ({ ...prev, scheduled_at: e.target.value }))}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createAuction} disabled={!newAuction.fund_id} className="btn-primary">Schedule</button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}</div>
      ) : auctions.length === 0 ? (
        <div className="card text-center py-12">
          <Gavel className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No auctions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map(a => {
            const config = statusConfig[a.status]
            const bidCount = (a.auction_bids as any)?.[0]?.count || 0
            const winner = (a.auction_winners as any)?.[0]
            return (
              <div key={a.id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.status === 'completed' ? 'bg-blue-100' : 'bg-brand-100'}`}>
                    {a.status === 'completed' ? <Trophy className="w-6 h-6 text-blue-600" /> : <Gavel className="w-6 h-6 text-brand-600" />}
                  </div>
                  <div>
                    <p className="font-semibold">{(a.chit_funds as any)?.name}</p>
                    <p className="text-sm text-gray-500">Month {a.month_number} · {bidCount} bids</p>
                    {a.scheduled_at && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(a.scheduled_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                    {winner && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Winner: {(winner.profiles as any)?.full_name || 'Selected'} · ₹{winner.winning_bid?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`badge ${config.badge}`}>{config.label}</span>
                  {a.status === 'scheduled' && (
                    <button onClick={() => startAuction(a.id)} className="btn-primary text-sm">Start</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
