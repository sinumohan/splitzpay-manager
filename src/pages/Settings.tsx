import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface CompanyForm {
  name: string
  description: string
  address: string
  phone: string
  email: string
}

export default function Settings() {
  const { activeCompany, companyRole } = useAuth()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit } = useForm<CompanyForm>({
    defaultValues: {
      name: activeCompany?.name || '',
      description: activeCompany?.description || '',
      address: activeCompany?.address || '',
      phone: activeCompany?.phone || '',
      email: activeCompany?.email || '',
    },
  })

  const onSubmit = async (data: CompanyForm) => {
    if (!activeCompany || companyRole !== 'admin') return
    setSaving(true)
    const { error } = await supabase.from('companies').update(data).eq('id', activeCompany.id)
    if (error) toast.error(error.message)
    else toast.success('Company settings saved')
    setSaving(false)
  }

  if (companyRole !== 'admin') {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Only Company Admins can access settings.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Company Settings</h1>

      <div className="card">
        <h2 className="font-semibold mb-4">Company Information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input {...register('name')} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea {...register('description')} className="input" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input {...register('email')} type="email" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input {...register('phone')} type="tel" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea {...register('address')} className="input" rows={2} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
