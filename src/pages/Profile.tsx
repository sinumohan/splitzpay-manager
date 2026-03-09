import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface Form { full_name: string; phone: string }

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm<Form>({
    defaultValues: { full_name: profile?.full_name || '', phone: profile?.phone || '' },
  })

  const onSubmit = async (data: Form) => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update(data).eq('id', profile?.id)
    if (error) toast.error(error.message)
    else { await refreshProfile(); toast.success('Profile updated') }
    setSaving(false)
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input {...register('full_name')} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input {...register('phone')} type="tel" className="input" placeholder="+91 9876543210" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
