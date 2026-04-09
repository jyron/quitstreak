import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const NUDGE_COOLDOWN_MS = 60_000

export function usePartnerData(shareCode) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nudgeSent, setNudgeSent] = useState(false)
  const [nudgeCooldown, setNudgeCooldown] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [senderProfile, setSenderProfile] = useState(null)

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

      // Persist the follow relationship for authenticated users (fire and forget)
      if (user) {
        supabase
          .from('supporter_follows')
          .upsert(
            { supporter_id: user.id, share_code: shareCode },
            { onConflict: 'supporter_id,share_code', ignoreDuplicates: true }
          )
          .then()

        // Fetch sender's profile to check subscription status
        const { data: senderData } = await supabase
          .from('profiles')
          .select('display_name, subscription_status')
          .eq('id', user.id)
          .maybeSingle()

        if (!cancelled && senderData) {
          setSenderProfile(senderData)
        }
      }

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

    // Check free nudge limit for authenticated non-subscribers
    const isSubscribed = senderProfile?.subscription_status === 'active' || senderProfile?.subscription_status === 'canceled'
    if (user && !isSubscribed) {
      const freeUsed = localStorage.getItem(`nudge_free_${shareCode}`)
      if (freeUsed) {
        setShowPaywall(true)
        return { error: 'paywall' }
      }
    }

    // Look up the sender's display name if they're signed in
    let senderName = senderProfile?.display_name || null

    const { error } = await supabase
      .from('nudges')
      .insert({
        user_id: profile.id,
        share_code: shareCode,
        sender_name: senderName,
      })

    if (error) {
      return { error: 'Could not send encouragement. Please try again.' }
    }

    // Mark free nudge as used for non-subscribers
    if (user && !isSubscribed) {
      localStorage.setItem(`nudge_free_${shareCode}`, '1')
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
  }, [profile, shareCode, nudgeCooldown, senderProfile, user])

  return { profile, checkins, loading, error, sendNudge, nudgeSent, nudgeCooldown, showPaywall, setShowPaywall }
}
