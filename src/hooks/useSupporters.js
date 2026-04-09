import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSupporters(shareCode) {
  const { user } = useAuth()
  const [supporters, setSupporters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !shareCode) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      setLoading(true)

      // Fetch followers of this share code
      const { data: follows, error: followsError } = await supabase
        .from('supporter_follows')
        .select('supporter_id, created_at')
        .eq('share_code', shareCode)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (followsError || !follows || follows.length === 0) {
        setSupporters([])
        setLoading(false)
        return
      }

      // Fetch supporter profiles
      const ids = follows.map(f => f.supporter_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ids)

      if (cancelled) return

      // Fetch unique sender names from nudges to identify active encouragers
      const { data: nudges } = await supabase
        .from('nudges')
        .select('sender_name')
        .eq('user_id', user.id)

      const activeSenderNames = new Set(
        (nudges || []).map(n => n.sender_name).filter(Boolean)
      )

      // Merge: followers + highlight active encouragers
      const profilesById = Object.fromEntries(
        (profiles || []).map(p => [p.id, p])
      )

      const merged = follows
        .map(f => {
          const profile = profilesById[f.supporter_id]
          if (!profile) return null
          return {
            id: profile.id,
            display_name: profile.display_name,
            followed_at: f.created_at,
            has_encouraged: activeSenderNames.has(profile.display_name),
          }
        })
        .filter(Boolean)

      setSupporters(merged)
      setLoading(false)
    }

    fetchData()

    return () => { cancelled = true }
  }, [user, shareCode])

  return { supporters, loading }
}
