import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  duration_months: z.number().int().min(1).max(60),
  monthly_amount: z.number().min(100, 'Minimum ₹100'),
  max_members: z.number().int().min(2).max(100),
  commission_rate: z.number().min(0).max(20),
  start_date: z.string().optional(),
})
type Form = z.infer<typeof schema>

export default function NewFund() {
  const { activeCompany, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration_months: 12,
      commission_rate: 5,
      max_members: 20,
      monthly_amount: 5000,
    },
  })

  const monthly = watch('monthly_amount') || 0
  const months = watch('duration_months') || 0
  const members = watch('max_members') || 0

  const onSubmit = async (data: Form) => {
    if (!activeCompany || !user) return
    setLoading(true)
    try {
      const { data: fund, error } = await supabase
        .from('chit_funds')
        .insert({
          ...data,
          company_id: activeCompany.id,
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      toast.success('Fund created!')
      navigate(`/funds/${fund.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create fund')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/funds" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Create New Fund</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Fund Name *</label>
              <input {...register('name')} className="input" placeholder="Monthly Savings Group - Jan 2026" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea {...register('description')} className="input" rows={2} placeholder="Brief description..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Amount (₹) *</label>
              <input {...register('monthly_amount', { valueAsNumber: true })} type="number" className="input" min={100} />
              {errors.monthly_amount && <p className="text-red-500 text-xs mt-1">{errors.monthly_amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (months) *</label>
              <input {...register('duration_months', { valueAsNumber: true })} type="number" className="input" min={1} max={60} />
              {errors.duration_months && <p className="text-red-500 text-xs mt-1">{errors.duration_months.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Members *</label>
              <input {...register('max_members', { valueAsNumber: true })} type="number" className="input" min={2} max={100} />
              {errors.max_members && <p className="text-red-500 text-xs mt-1">{errors.max_members.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
              <input {...register('commission_rate', { valueAsNumber: true })} type="number" step="0.5" className="input" min={0} max={20} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input {...register('start_date')} type="date" className="input" />
            </div>
          </div>

          {monthly > 0 && months > 0 && (
            <div className="bg-brand-50 rounded-lg p-4 space-y-1">
              <p className="text-sm font-semibold text-brand-800">Fund Summary</p>
              <p className="text-sm text-brand-700">Total Pool: ₹{(monthly * members).toLocaleString()} (per cycle)</p>
              <p className="text-sm text-brand-700">Duration: {months} months · Commission: {watch('commission_rate')}%</p>
            </div>
          )}

          <button type="submit" disabled={loading || !activeCompany} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Fund'}
          </button>
        </form>
      </div>
    </div>
  )
}
