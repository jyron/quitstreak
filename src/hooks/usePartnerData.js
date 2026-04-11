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
  const [freeNudgeUsed, setFreeNudgeUsed] = useState(false)
  const [activeGift, setActiveGift] = useState(null)
  const [daysSinceLastCheckin, setDaysSinceLastCheckin] = useState(null)

  useEffect(() => {
    if (!shareCode) {
      setLoading(false)
      setError('No share code provided')
      return
    }

    // Purge leftover localStorage keys from the pre-server-gate nudge flow
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && (k.startsWith('nudge_free_') || /^nudge_[a-f0-9]{4,}$/.test(k))) {
          localStorage.removeItem(k)
        }
      }
    } catch {}

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

      // Authenticated: resolve sender profile + follow state
      if (user) {
        // Fetch sender profile to check subscription status
        const { data: senderData } = await supabase
          .from('profiles')
          .select('display_name, subscription_status')
          .eq('id', user.id)
          .maybeSingle()

        if (!cancelled && senderData) setSenderProfile(senderData)

        // Fetch (or create) the follow row to know if free nudge was already used
        const { data: followData } = await supabase
          .from('supporter_follows')
          .select('free_nudge_used')
          .eq('supporter_id', user.id)
          .eq('share_code', shareCode)
          .maybeSingle()

        if (!cancelled) {
          setFreeNudgeUsed(followData?.free_nudge_used ?? false)
        }

        // Check if this user has an active gifted subscription
        const { data: giftData } = await supabase
          .from('gifted_subscriptions')
          .select('id, gifter_user_id, status')
          .eq('recipient_user_id', user.id)
          .in('status', ['active', 'canceled'])
          .limit(1)
          .maybeSingle()

        if (!cancelled && giftData) {
          const { data: gifterData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', giftData.gifter_user_id)
            .maybeSingle()
          if (!cancelled) {
            setActiveGift({ ...giftData, gifter_name: gifterData?.display_name || null })
          }
        }

        // Auto-create the follow row if missing (ignore errors; RPC will also upsert)
        if (!followData) {
          supabase
            .from('supporter_follows')
            .upsert(
              { supporter_id: user.id, share_code: shareCode },
              { onConflict: 'supporter_id,share_code', ignoreDuplicates: true }
            )
            .then()
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

      if (checkinData && checkinData.length > 0) {
        const last = new Date(checkinData[0].created_at)
        const days = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
        setDaysSinceLastCheckin(days)
      } else {
        setDaysSinceLastCheckin(null)
      }
    }

    fetchData()

    return () => { cancelled = true }
  }, [shareCode, user?.id])

  const sendNudge = useCallback(async (senderNameOverride) => {
    if (!profile || nudgeCooldown) return { error: 'Please wait before sending another.' }
    if (!user) return { error: 'signup' }

    const senderName = senderNameOverride ?? senderProfile?.display_name ?? null

    const { data, error } = await supabase.rpc('send_nudge', {
      p_share_code: shareCode,
      p_sender_name: senderName,
    })

    if (error) {
      return { error: 'Could not send encouragement. Please try again.' }
    }

    // RPC returns { ok: boolean, reason?: string }
    if (!data?.ok) {
      if (data?.reason === 'paywall') {
        setShowPaywall(true)
        setFreeNudgeUsed(true)
        return { error: 'paywall' }
      }
      if (data?.reason === 'signup') return { error: 'signup' }
      if (data?.reason === 'self') return { error: "You can't nudge yourself." }
      return { error: 'This share link is no longer active.' }
    }

    // Success — update local state
    const selfSubbed = senderProfile?.subscription_status === 'active' || senderProfile?.subscription_status === 'canceled'
    const isSubscribed = selfSubbed || !!activeGift
    if (!isSubscribed) setFreeNudgeUsed(true)

    setNudgeSent(true)
    setNudgeCooldown(true)
    setTimeout(() => {
      setNudgeCooldown(false)
      setNudgeSent(false)
    }, NUDGE_COOLDOWN_MS)

    return { error: null }
  }, [profile, shareCode, nudgeCooldown, senderProfile, user, activeGift])

  return {
    profile, checkins, loading, error,
    sendNudge, nudgeSent, nudgeCooldown,
    showPaywall, setShowPaywall,
    daysSinceLastCheckin, senderProfile, freeNudgeUsed, activeGift,
  }
}
