import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChitFund } from '../types'
import { Store, Eye, EyeOff, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MarketplaceConfig() {
  const { activeCompany } = useAuth()
  const [funds, setFunds] = useState<(ChitFund & { marketplace_listings?: any[] })[]>([])
  const [loading, setLoading] = useState(true)

  const loadFunds = async () => {
    if (!activeCompany) return
    const { data } = await supabase
      .from('chit_funds')
      .select('*, marketplace_listings(*)')
      .eq('company_id', activeCompany.id)
      .in('status', ['draft', 'active'])
    setFunds(data || [])
    setLoading(false)
  }

  useEffect(() => { loadFunds() }, [activeCompany?.id])

  const toggleListing = async (fund: ChitFund & { marketplace_listings?: any[] }) => {
    const existing = fund.marketplace_listings?.[0]
    try {
      if (existing) {
        await supabase.from('marketplace_listings').update({ is_active: !existing.is_active }).eq('id', existing.id)
        await supabase.from('chit_funds').update({ is_listed: !existing.is_active }).eq('id', fund.id)
        toast.success(existing.is_active ? 'Removed from marketplace' : 'Listed on marketplace')
      } else {
        await supabase.from('marketplace_listings').insert({ fund_id: fund.id, is_active: true })
        await supabase.from('chit_funds').update({ is_listed: true }).eq('id', fund.id)
        toast.success('Fund listed on marketplace!')
      }
      loadFunds()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update listing')
    }
  }

  const toggleFeatured = async (fund: ChitFund & { marketplace_listings?: any[] }) => {
    const existing = fund.marketplace_listings?.[0]
    if (!existing) { toast.error('List the fund first'); return }
    await supabase.from('marketplace_listings').update({ featured: !existing.featured }).eq('id', existing.id)
    toast.success(existing.featured ? 'Removed from featured' : 'Marked as featured')
    loadFunds()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-gray-500 mt-1">
          List your funds on the SplitzPay Marketplace for members to discover and join.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}</div>
      ) : funds.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No active or draft funds to list</p>
        </div>
      ) : (
        <div className="space-y-3">
          {funds.map(fund => {
            const listing = fund.marketplace_listings?.[0]
            const isListed = listing?.is_active

            return (
              <div key={fund.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isListed ? 'bg-brand-100' : 'bg-gray-100'}`}>
                    <Store className={`w-6 h-6 ${isListed ? 'text-brand-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{fund.name}</p>
                      {isListed && <span className="badge badge-green">Listed</span>}
                      {listing?.featured && (
                        <span className="badge badge-yellow flex items-center gap-1">
                          <Star className="w-3 h-3" /> Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      ₹{fund.monthly_amount.toLocaleString()}/mo · {fund.duration_months}m · Max {fund.max_members} members
                    </p>
                    <span className={`badge mt-1 ${fund.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                      {fund.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isListed && (
                    <button
                      onClick={() => toggleFeatured(fund)}
                      className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        listing?.featured
                          ? 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      {listing?.featured ? 'Unfeature' : 'Feature'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleListing(fund)}
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      isListed
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-brand-200 text-brand-600 hover:bg-brand-50'
                    }`}
                  >
                    {isListed ? <><EyeOff className="w-4 h-4" /> Unlist</> : <><Eye className="w-4 h-4" /> List</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
