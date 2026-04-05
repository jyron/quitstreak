import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export function useCheckins() {
  const { user } = useAuth()
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setCheckins([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchCheckins() {
      setLoading(true)
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (cancelled) return

      if (error) {
        setError(error.message)
      } else {
        setCheckins(data || [])
      }
      setLoading(false)
    }

    fetchCheckins()
    return () => { cancelled = true }
  }, [user])

  const todayCheckin = useMemo(() => {
    if (!checkins.length) return null
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const latest = new Date(checkins[0].created_at)
    return latest >= startOfDay ? checkins[0] : null
  }, [checkins])

  async function submitCheckin({ mood, craving, note }) {
    if (!user) return { error: 'Not authenticated' }

    if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
      return { error: 'Mood must be between 1 and 5' }
    }
    if (!Number.isInteger(craving) || craving < 1 || craving > 5) {
      return { error: 'Craving must be between 1 and 5' }
    }

    const trimmedNote = note?.trim() || null
    const finalNote = trimmedNote && trimmedNote.length > 280
      ? trimmedNote.slice(0, 280)
      : trimmedNote

    const { data, error } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        mood,
        craving,
        note: finalNote,
      })
      .select()
      .single()

    if (!error && data) {
      setCheckins((prev) => [data, ...prev])
    }

    return { data, error }
  }

  return { checkins, loading, error, todayCheckin, submitCheckin }
}
