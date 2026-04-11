import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Share2, Check, LinkIcon, Gift } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function PartnerSetup() {
  const { profile, updateProfile, loading } = useProfile()
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const [toggling, setToggling] = useState(false)

  // Gift-a-supporter state
  const [gifts, setGifts] = useState([])
  const [giftEmail, setGiftEmail] = useState('')
  const [giftPlan, setGiftPlan] = useState('yearly')
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftError, setGiftError] = useState(null)
  const [giftSuccess, setGiftSuccess] = useState(false)

  // Handle return from Stripe gift checkout
  useEffect(() => {
    if (searchParams.get('checkout') === 'gift_success') {
      setGiftSuccess(true)
      setSearchParams({}, { replace: true })
    }
  }, [])

  // Load existing gifts the user has given
  useEffect(() => {
    if (!profile?.id) return
    let cancelled = false
    supabase
      .from('gifted_subscriptions')
      .select('id, recipient_email, status, created_at')
      .eq('gifter_user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled && data) setGifts(data)
      })
    return () => { cancelled = true }
  }, [profile?.id, giftSuccess])

  async function handleGiftCheckout() {
    setGiftError(null)
    const email = giftEmail.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGiftError('Enter a valid email address.')
      return
    }
    setGiftLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          plan: giftPlan,
          giftForEmail: email,
          successPath: '/app/partner-setup',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not start checkout.')
      window.location.href = data.url
    } catch (err) {
      setGiftError(err.message)
      setGiftLoading(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  const shareUrl = profile.share_code
    ? `${import.meta.env.VITE_APP_URL}/partner/${profile.share_code}`
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

      {/* ─── Gift a supporter subscription ──────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-5 h-5 text-secondary" />
          <h2 className="font-serif text-xl font-bold text-text">Gift unlimited support</h2>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-5">
          Want someone to cheer you on without limits? Pay for their subscription
          so they can send you unlimited check-in reminders.
        </p>

        {giftSuccess && (
          <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl px-5 py-4">
            <p className="font-medium text-primary">Gift sent!</p>
            <p className="text-sm text-primary/70 mt-0.5">
              They'll unlock unlimited reminders the next time they open the app.
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Supporter's email
          </label>
          <input
            type="email"
            value={giftEmail}
            onChange={(e) => setGiftEmail(e.target.value)}
            placeholder="supporter@example.com"
            className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              onClick={() => setGiftPlan('monthly')}
              className={`py-4 px-3 rounded-xl border-2 text-center transition-all ${
                giftPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <p className="font-serif text-xl font-bold text-text">$5.99</p>
              <p className="text-xs text-text-secondary mt-1">per month</p>
            </button>
            <button
              type="button"
              onClick={() => setGiftPlan('yearly')}
              className={`py-4 px-3 rounded-xl border-2 text-center transition-all relative ${
                giftPlan === 'yearly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                Save 44%
              </div>
              <p className="font-serif text-xl font-bold text-text">$39.99</p>
              <p className="text-xs text-text-secondary mt-1">per year</p>
            </button>
          </div>

          <button
            onClick={handleGiftCheckout}
            disabled={giftLoading || !giftEmail}
            className="mt-4 w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            {giftLoading ? 'Redirecting...' : 'Gift this subscription'}
          </button>

          {giftError && <p className="mt-3 text-sm text-danger">{giftError}</p>}
          <p className="mt-3 text-xs text-text-secondary text-center">
            Billed to your card. Cancel anytime from your account.
          </p>
        </div>

        {gifts.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Active gifts
            </p>
            <div className="space-y-2">
              {gifts.map((g) => (
                <div key={g.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{g.recipient_email}</p>
                    <p className="text-xs text-text-secondary capitalize mt-0.5">{g.status}</p>
                  </div>
                  <Gift className="w-4 h-4 text-secondary" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

