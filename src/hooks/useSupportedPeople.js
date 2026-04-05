import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSupportedPeople() {
  const { user } = useAuth()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)

      // Fetch all share codes this supporter is following
      const { data: follows, error: followsError } = await supabase
        .from('supporter_follows')
        .select('share_code, created_at')
        .eq('supporter_id', user.id)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (followsError) {
        setError('Could not load your supported people.')
        setLoading(false)
        return
      }

      if (!follows || follows.length === 0) {
        setPeople([])
        setLoading(false)
        return
      }

      // Fetch all corresponding profiles in one query
      const shareCodes = follows.map(f => f.share_code)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('display_name, quit_type, quit_date, share_code, share_active')
        .in('share_code', shareCodes)

      if (cancelled) return

      if (profilesError) {
        setError('Could not load profile data.')
        setLoading(false)
        return
      }

      // Merge and preserve follow order (most recently followed first)
      const profilesByCode = Object.fromEntries(
        (profiles || []).map(p => [p.share_code, p])
      )
      const merged = follows
        .map(f => profilesByCode[f.share_code])
        .filter(Boolean)

      setPeople(merged)
      setLoading(false)
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [user])

  return { people, loading, error }
}
