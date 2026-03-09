import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ChitFund, NotificationConfig } from '../types'
import { Bell, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
  { key: 'member_joined', label: 'Member Joined', description: 'When a member requests to join a fund' },
  { key: 'member_approved', label: 'Member Approved', description: 'When a member is approved' },
  { key: 'member_rejected', label: 'Member Rejected', description: 'When a member application is rejected' },
  { key: 'auction_scheduled', label: 'Auction Scheduled', description: 'When an auction is scheduled' },
  { key: 'auction_started', label: 'Auction Started', description: 'When an auction goes live' },
  { key: 'auction_winner', label: 'Auction Winner', description: 'When auction winner is announced' },
  { key: 'profit_shared', label: 'Profit Shared', description: 'When profits are distributed' },
  { key: 'payment_reminder', label: 'Payment Reminder', description: 'Monthly payment reminders' },
  { key: 'document_approved', label: 'Document Approved', description: 'When KYC document is approved' },
  { key: 'document_rejected', label: 'Document Rejected', description: 'When KYC document is rejected' },
]

export default function NotificationsConfig() {
  const { activeCompany, user } = useAuth()
  const [funds, setFunds] = useState<ChitFund[]>([])
  const [selectedFund, setSelectedFund] = useState<string>('')
  const [configs, setConfigs] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadFunds = async () => {
      if (!activeCompany) return
      const { data } = await supabase
        .from('chit_funds')
        .select('id, name')
        .eq('company_id', activeCompany.id)
        .order('name')
      setFunds(data || [])
      if (data && data.length > 0) setSelectedFund(data[0].id)
    }
    loadFunds()
  }, [activeCompany?.id])

  useEffect(() => {
    const loadConfigs = async () => {
      if (!selectedFund) return
      setLoading(true)
      const { data } = await supabase
        .from('notification_configs')
        .select('*')
        .eq('fund_id', selectedFund)

      const configMap: Record<string, boolean> = {}
      EVENT_TYPES.forEach(e => { configMap[e.key] = true }) // default enabled
      data?.forEach((c: NotificationConfig) => { configMap[c.event_type] = c.is_enabled })
      setConfigs(configMap)
      setLoading(false)
    }
    loadConfigs()
  }, [selectedFund])

  const saveConfigs = async () => {
    if (!selectedFund || !user) return
    setSaving(true)
    try {
      const upserts = EVENT_TYPES.map(e => ({
        fund_id: selectedFund,
        event_type: e.key,
        is_enabled: configs[e.key] ?? true,
        configured_by: user.id,
      }))
      const { error } = await supabase.from('notification_configs').upsert(upserts, {
        onConflict: 'fund_id,event_type',
      })
      if (error) throw error
      toast.success('Notification settings saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-gray-500 mt-1">Configure email notifications for each fund via AWS SES.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Select Fund</label>
          <select value={selectedFund} onChange={e => setSelectedFund(e.target.value)} className="input">
            {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>

      {selectedFund && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-600" />
              Email Notifications
            </h2>
            <button onClick={saveConfigs} disabled={saving || loading} className="btn-primary flex items-center gap-2 text-sm">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {EVENT_TYPES.map(event => (
                <div key={event.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{event.label}</p>
                    <p className="text-xs text-gray-500">{event.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configs[event.key] ?? true}
                      onChange={e => setConfigs(prev => ({ ...prev, [event.key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
