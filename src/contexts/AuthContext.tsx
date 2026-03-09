import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile, Company, CompanyMember } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  companies: Company[]
  activeCompany: Company | null
  companyRole: 'admin' | 'manager' | null
  setActiveCompany: (c: Company) => Promise<void>
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  createCompany: (name: string, description?: string) => Promise<Company>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null)
  const [companyRole, setCompanyRole] = useState<'admin' | 'manager' | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }

  const fetchCompanies = async (userId: string) => {
    const { data } = await supabase
      .from('company_members')
      .select('*, companies(*)')
      .eq('user_id', userId)
      .in('role', ['admin', 'manager'])
    if (data && data.length > 0) {
      const cos = data.map((m: any) => m.companies as Company)
      setCompanies(cos)
      if (cos.length > 0) {
        setActiveCompanyState(cos[0])
        setCompanyRole((data[0] as CompanyMember).role as 'admin' | 'manager')
      }
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchCompanies(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchCompanies(session.user.id)
      } else {
        setProfile(null)
        setCompanies([])
        setActiveCompanyState(null)
        setCompanyRole(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const setActiveCompany = async (c: Company) => {
    setActiveCompanyState(c)
    if (user) {
      const { data } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', c.id)
        .eq('user_id', user.id)
        .single()
      if (data) setCompanyRole(data.role as 'admin' | 'manager')
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  const signOut = async () => { await supabase.auth.signOut() }
  const refreshProfile = async () => { if (user) await fetchProfile(user.id) }

  const createCompany = async (name: string, description?: string): Promise<Company> => {
    if (!user) throw new Error('Not authenticated')
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
    const { data, error } = await supabase
      .from('companies')
      .insert({ name, slug, description, owner_id: user.id })
      .select()
      .single()
    if (error) throw error
    await supabase.from('company_members').insert({
      company_id: data.id, user_id: user.id, role: 'admin',
    })
    setCompanies(prev => [...prev, data])
    setActiveCompanyState(data)
    setCompanyRole('admin')
    return data
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, companies, activeCompany, companyRole,
      setActiveCompany, loading, signIn, signUp, signOut, refreshProfile, createCompany,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
