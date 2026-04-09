import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link, Copy, Share2, Check, LinkIcon, Heart, Users, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

export default function PartnerSetup() {
  const { session } = useAuth()
  const { profile, updateProfile, refetchProfile, loading } = useProfile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const [toggling, setToggling] = useState(false)

  const isSubscribed = profile?.subscription_status === 'active' || profile?.subscription_status === 'canceled'

  // After Stripe checkout redirect, refetch profile to pick up new subscription status
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      let attempts = 0
      const poll = setInterval(async () => {
        await refetchProfile()
        attempts++
        if (attempts >= 5) clearInterval(poll)
      }, 1500)
      // Clean up the query param
      setSearchParams({}, { replace: true })
      return () => clearInterval(poll)
    }
  }, [])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!isSubscribed) {
    return <SubscriptionGate session={session} checkoutSuccess={searchParams.get('checkout') === 'success'} />
  }

  const shareUrl = profile.share_code
    ? `${window.location.origin}/partner/${profile.share_code}`
    : null

  async function generateShareCode() {
    setGenerating(true)
    setError(null)

    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    const { error } = await updateProfile({ share_code: code })

    setGenerating(false)
    if (error) {
      setError(typeof error === 'string' ? error : 'Could not generate share link. Please try again.')
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy to clipboard.')
    }
  }

  async function handleShare() {
    if (!shareUrl || !navigator.share) return
    try {
      await navigator.share({
        title: 'Follow my quitting journey',
        text: `I'm quitting ${profile.quit_type}. Follow my progress and help me stay accountable.`,
        url: shareUrl,
      })
    } catch {
      // User cancelled share — ignore
    }
  }

  async function toggleSharing() {
    setToggling(true)
    setError(null)
    const { error } = await updateProfile({ share_active: !profile.share_active })
    setToggling(false)
    if (error) {
      setError(typeof error === 'string' ? error : 'Could not update sharing setting.')
    }
  }

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="font-serif text-2xl font-bold text-text mb-2">Share Your Journey</h1>
      <p className="text-text-secondary leading-relaxed mb-8">
        Give someone you trust a live view of your progress. They'll see your streak, check-ins, and can send you encouragement.
      </p>

      {!profile.share_code ? (
        /* No share code yet */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text">Create a share link</p>
              <p className="text-sm text-text-secondary">Anyone with the link can view your dashboard</p>
            </div>
          </div>
          <button
            onClick={generateShareCode}
            disabled={generating}
            className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate share link'}
          </button>
        </div>
      ) : (
        /* Share code exists */
        <div className="space-y-4">
          {/* Share link card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              Your share link
            </p>
            <div className="bg-background rounded-lg px-4 py-3 text-sm text-text break-all font-mono">
              {shareUrl}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-primary text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy link
                  </>
                )}
              </button>

              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
            </div>
          </div>

          {/* Sharing toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text">Sharing {profile.share_active ? 'active' : 'paused'}</p>
                <p className="text-sm text-text-secondary mt-0.5">
                  {profile.share_active
                    ? 'Your supporter can view your dashboard.'
                    : 'Your link is paused. No one can view your dashboard.'}
                </p>
              </div>
              <button
                onClick={toggleSharing}
                disabled={toggling}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  profile.share_active ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    profile.share_active ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger mt-4">{error}</p>
      )}
    </div>
  )
}

function SubscriptionGate({ session, checkoutSuccess }) {
  const [plan, setPlan] = useState('yearly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')

      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="px-6 pt-8 pb-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-text mb-2">Partner Support</h1>
      <p className="text-text-secondary leading-relaxed mb-8">
        Give someone you trust a live view of your progress. They'll see your streak, check-ins, and can send you encouragement.
      </p>

      {checkoutSuccess && (
        <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4">
          <p className="text-sm font-medium text-primary">Activating your subscription...</p>
          <p className="text-xs text-primary/70 mt-1">This usually takes a few seconds.</p>
        </div>
      )}

      {/* Value props */}
      <div className="space-y-3 mb-8">
        {[
          { icon: Users, title: 'Live partner dashboard', desc: 'Your supporter sees your streak, mood, and milestones in real time.' },
          { icon: Heart, title: 'Encouragement messages', desc: 'They can send you notes of support when you need it most.' },
          { icon: Shield, title: 'Real accountability', desc: 'Knowing someone is watching makes all the difference.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4 items-start bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text text-sm">{title}</p>
              <p className="text-sm text-text-secondary mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan toggle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">Choose your plan</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setPlan('monthly')}
            className={`py-4 px-3 rounded-xl border-2 text-center transition-all ${
              plan === 'monthly'
                ? 'border-primary bg-primary/5'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="font-serif text-xl font-bold text-text">$5.99</p>
            <p className="text-xs text-text-secondary mt-1">per month</p>
          </button>

          <button
            onClick={() => setPlan('yearly')}
            className={`py-4 px-3 rounded-xl border-2 text-center transition-all relative ${
              plan === 'yearly'
                ? 'border-primary bg-primary/5'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              Save 44%
            </div>
            <p className="font-serif text-xl font-bold text-text">$39.99</p>
            <p className="text-xs text-text-secondary mt-1">per year</p>
          </button>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Redirecting to checkout...' : 'Subscribe to QuitStreak+'}
        </button>

        {error && <p className="text-sm text-danger mt-3">{error}</p>}

        <p className="text-xs text-text-secondary text-center mt-3">
          Cancel anytime. Secure checkout powered by Stripe.
        </p>
      </div>
    </div>
  )
}
