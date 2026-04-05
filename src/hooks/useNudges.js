import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useNudges() {
  const { user } = useAuth()
  const [nudges, setNudges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNudges([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchNudges() {
      setLoading(true)
      const { data } = await supabase
        .from('nudges')
        .select('*')
        .eq('user_id', user.id)
        .eq('seen', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (cancelled) return
      setNudges(data || [])
      setLoading(false)
    }

    fetchNudges()
    return () => { cancelled = true }
  }, [user])

  const dismissNudges = useCallback(async () => {
    if (!nudges.length) return

    const ids = nudges.map(n => n.id)
    await supabase
      .from('nudges')
      .update({ seen: true })
      .in('id', ids)

    setNudges([])
  }, [nudges])

  return { nudges, loading, dismissNudges }
}
