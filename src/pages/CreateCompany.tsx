import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'

interface Form { name: string; description: string }

export default function CreateCompany() {
  const { createCompany } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>()

  const onSubmit = async (data: Form) => {
    setLoading(true)
    try {
      await createCompany(data.name, data.description)
      toast.success('Company created!')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create company')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Your Company</h1>
        <p className="text-gray-500 mt-1">Set up your chit fund company on SplitzPay</p>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              {...register('name', { required: 'Company name is required' })}
              className="input"
              placeholder="Acme Chit Funds"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              className="input"
              rows={3}
              placeholder="Brief description of your company..."
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Company'}
          </button>
        </form>
      </div>
    </div>
  )
}
