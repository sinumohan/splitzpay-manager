import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChitFund, FundMember, Document, FundJoinRequest } from '../types'
import { Users, FileText, CheckCircle, XCircle, ArrowLeft, UserPlus, Play, Pause } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'

type Tab = 'members' | 'documents' | 'requests'

export default function FundDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [fund, setFund] = useState<ChitFund | null>(null)
  const [members, setMembers] = useState<FundMember[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [joinRequests, setJoinRequests] = useState<FundJoinRequest[]>([])
  const [tab, setTab] = useState<Tab>('members')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const [{ data: fundData }, { data: membersData }, { data: docsData }, { data: requestsData }] =
        await Promise.all([
          supabase.from('chit_funds').select('*').eq('id', id).single(),
          supabase.from('fund_members').select('*, profiles(full_name, phone)').eq('fund_id', id).order('created_at'),
          supabase.from('documents').select('*, profiles(full_name)').eq('fund_id', id).eq('status', 'pending'),
          supabase.from('fund_join_requests').select('*, profiles(full_name, phone)').eq('fund_id', id).eq('status', 'pending'),
        ])
      setFund(fundData)
      setMembers(membersData || [])
      setDocuments(docsData || [])
      setJoinRequests(requestsData || [])
      setLoading(false)
    }
    load()
  }, [id])

  const updateFundStatus = async (status: ChitFund['status']) => {
    if (!fund) return
    const { error } = await supabase.from('chit_funds').update({ status }).eq('id', fund.id)
    if (!error) {
      setFund(prev => prev ? { ...prev, status } : prev)
      toast.success(`Fund ${status}`)
    }
  }

  const approveMember = async (memberId: string) => {
    const { error } = await supabase.from('fund_members').update({
      status: 'approved',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
    }).eq('id', memberId)
    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'approved' as const } : m))
      toast.success('Member approved')
    }
  }

  const rejectMember = async (memberId: string) => {
    const { error } = await supabase.from('fund_members').update({
      status: 'rejected', reviewed_by: user?.id,
    }).eq('id', memberId)
    if (!error) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'rejected' as const } : m))
      toast.success('Member rejected')
    }
  }

  const approveDoc = async (docId: string) => {
    await supabase.from('documents').update({
      status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
    toast.success('Document approved')
  }

  const rejectDoc = async (docId: string) => {
    const reason = window.prompt('Rejection reason (optional):') || 'Does not meet requirements'
    await supabase.from('documents').update({
      status: 'rejected', rejection_reason: reason, reviewed_by: user?.id,
    }).eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
    toast.success('Document rejected')
  }

  const approveJoinRequest = async (req: FundJoinRequest) => {
    await Promise.all([
      supabase.from('fund_join_requests').update({
        status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
      }).eq('id', req.id),
      supabase.from('fund_members').upsert({
        fund_id: req.fund_id, user_id: req.user_id, status: 'approved',
        joined_at: new Date().toISOString(),
      }),
    ])
    setJoinRequests(prev => prev.filter(r => r.id !== req.id))
    toast.success('Join request approved')
  }

  const rejectJoinRequest = async (reqId: string) => {
    await supabase.from('fund_join_requests').update({
      status: 'rejected', reviewed_by: user?.id,
    }).eq('id', reqId)
    setJoinRequests(prev => prev.filter(r => r.id !== reqId))
    toast.success('Join request rejected')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!fund) return <div className="text-center py-16 text-gray-500">Fund not found</div>

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'members', label: 'Members', icon: Users, count: members.length },
    { key: 'documents', label: 'Pending Docs', icon: FileText, count: documents.length },
    { key: 'requests', label: 'Join Requests', icon: UserPlus, count: joinRequests.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/funds" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold">{fund.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${
                fund.status === 'active' ? 'badge-green' :
                fund.status === 'draft' ? 'badge-yellow' :
                fund.status === 'completed' ? 'badge-blue' : 'badge-red'
              }`}>{fund.status}</span>
              {fund.is_listed && <span className="badge badge-blue">Listed</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {fund.status === 'draft' && (
            <button onClick={() => updateFundStatus('active')} className="btn-primary flex items-center gap-2 text-sm">
              <Play className="w-4 h-4" /> Activate
            </button>
          )}
          {fund.status === 'active' && (
            <button onClick={() => updateFundStatus('completed')} className="btn-secondary flex items-center gap-2 text-sm">
              <Pause className="w-4 h-4" /> Complete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monthly', value: `₹${fund.monthly_amount.toLocaleString()}` },
          { label: 'Duration', value: `${fund.duration_months} months` },
          { label: 'Max Members', value: fund.max_members },
          { label: 'Commission', value: `${fund.commission_rate}%` },
        ].map(s => (
          <div key={s.label} className="card py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className="bg-brand-100 text-brand-700 rounded-full px-1.5 text-xs">{t.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'members' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header hidden sm:table-cell">Phone</th>
                <th className="table-header">Status</th>
                <th className="table-header hidden md:table-cell">Joined</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No members yet</td></tr>
              ) : members.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{(m.profiles as any)?.full_name || 'Unknown'}</td>
                  <td className="table-cell hidden sm:table-cell text-gray-500">{(m.profiles as any)?.phone || '-'}</td>
                  <td className="table-cell">
                    <span className={`badge ${
                      m.status === 'approved' ? 'badge-green' :
                      m.status === 'pending' ? 'badge-yellow' :
                      m.status === 'invited' ? 'badge-blue' : 'badge-red'
                    }`}>{m.status}</span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-500">
                    {m.joined_at ? format(new Date(m.joined_at), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="table-cell">
                    {(m.status === 'pending' || m.status === 'invited') && (
                      <div className="flex gap-2">
                        <button onClick={() => approveMember(m.id)} className="text-green-600 hover:text-green-700" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => rejectMember(m.id)} className="text-red-500 hover:text-red-600" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
              <p>No pending documents</p>
            </div>
          ) : documents.map(doc => (
            <div key={doc.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">{(doc.profiles as any)?.full_name}</p>
                <p className="text-sm text-gray-500 capitalize">{doc.document_type.replace('_', ' ')} · {doc.file_name}</p>
                <p className="text-xs text-gray-400">{format(new Date(doc.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">View</a>
                <button onClick={() => approveDoc(doc.id)} className="btn-primary text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => rejectDoc(doc.id)} className="btn-danger text-sm flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          {joinRequests.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              <UserPlus className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No pending join requests</p>
            </div>
          ) : joinRequests.map(req => (
            <div key={req.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">{(req.profiles as any)?.full_name}</p>
                <p className="text-sm text-gray-500">{(req.profiles as any)?.phone}</p>
                {req.message && <p className="text-sm text-gray-600 mt-1 italic">"{req.message}"</p>}
                <p className="text-xs text-gray-400 mt-1">{format(new Date(req.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => approveJoinRequest(req)} className="btn-primary text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => rejectJoinRequest(req.id)} className="btn-danger text-sm flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
