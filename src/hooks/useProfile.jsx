import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Don't touch profile state until auth has resolved.
    // Without this guard, the effect fires on mount with user=null and sets
    // profile=null + loading=false. When auth then resolves with a real user,
    // RequireAuth briefly sees (profile=null, loading=false, user=<real>)
    // and redirects to onboarding before the fetch can run.
    if (authLoading) return

    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchProfile() {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setError(error.message)
      } else {
        setProfile(data) // null if no row yet
      }
      setLoading(false)
    }

    fetchProfile()
    return () => { cancelled = true }
  }, [user?.id, authLoading])

  async function refetchProfile() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data)
  }

  async function updateProfile(updates) {
    if (!user) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error) setProfile(data)
    return { data, error }
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, error, updateProfile, setProfile, refetchProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === null) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
