import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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
  }, [user])

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

  return { profile, loading, error, updateProfile }
}
