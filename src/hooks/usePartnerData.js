import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const NUDGE_COOLDOWN_MS = 60_000

export function usePartnerData(shareCode) {
  const [profile, setProfile] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nudgeSent, setNudgeSent] = useState(false)
  const [nudgeCooldown, setNudgeCooldown] = useState(false)

  useEffect(() => {
    if (!shareCode) {
      setLoading(false)
      setError('No share code provided')
      return
    }

    // Check if we're still in cooldown from a previous visit
    const lastNudge = localStorage.getItem(`nudge_${shareCode}`)
    if (lastNudge && Date.now() - Number(lastNudge) < NUDGE_COOLDOWN_MS) {
      setNudgeCooldown(true)
      const remaining = NUDGE_COOLDOWN_MS - (Date.now() - Number(lastNudge))
      const timer = setTimeout(() => setNudgeCooldown(false), remaining)
      // cleanup handled below
      var cooldownTimer = timer
    }

    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)

      // Fetch profile by share code
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, quit_type, quit_date, share_active')
        .eq('share_code', shareCode)
        .eq('share_active', true)
        .maybeSingle()

      if (cancelled) return

      if (profileError) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      if (!profileData) {
        setError('This share link is no longer active.')
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fetch checkins for this user
      const { data: checkinData, error: checkinError } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (cancelled) return

      if (checkinError) {
        setError('Could not load check-in data.')
        setLoading(false)
        return
      }

      setCheckins(checkinData || [])
      setLoading(false)
    }

    fetchData()

    return () => {
      cancelled = true
      if (cooldownTimer) clearTimeout(cooldownTimer)
    }
  }, [shareCode])

  const sendNudge = useCallback(async () => {
    if (!profile || nudgeCooldown) return { error: 'Please wait before sending another.' }

    const { error } = await supabase
      .from('nudges')
      .insert({
        user_id: profile.id,
        share_code: shareCode,
      })

    if (error) {
      return { error: 'Could not send encouragement. Please try again.' }
    }

    // Set cooldown
    localStorage.setItem(`nudge_${shareCode}`, String(Date.now()))
    setNudgeSent(true)
    setNudgeCooldown(true)
    setTimeout(() => {
      setNudgeCooldown(false)
      setNudgeSent(false)
    }, NUDGE_COOLDOWN_MS)

    return { error: null }
  }, [profile, shareCode, nudgeCooldown])

  return { profile, checkins, loading, error, sendNudge, nudgeSent, nudgeCooldown }
}
