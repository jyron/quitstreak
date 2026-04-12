import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Heart, Send, X, MessageCircle, Users, Bell, Lock, Gift } from 'lucide-react'
import StreakCounter from '../components/StreakCounter'
import CheckinHistory from '../components/CheckinHistory'
import { usePartnerData } from '../hooks/usePartnerData'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const TYPE_LABELS = {
  drinking: 'alcohol',
  smoking: 'smoking',
  vaping: 'vaping',
}

function PaywallModal({ onClose, displayName, session, shareCode, freeNudgeUsed }) {
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
        body: JSON.stringify({ plan, successPath: `/partner/${shareCode}` }),
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 pb-8 sm:mx-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text transition-colors p-1"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-secondary" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-text">
            {freeNudgeUsed ? 'You made their day!' : `Support ${displayName}`}
          </h2>
          <p className="mt-2 text-text-secondary leading-relaxed">
            {freeNudgeUsed
              ? `${displayName} saw your encouragement. Subscribe to keep sending unlimited reminders.`
              : `Subscribe to send ${displayName} unlimited check-in reminders and cheer them on every day.`}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { icon: MessageCircle, text: 'Unlimited check-in reminders' },
            { icon: Users, text: 'Follow as many people as you want' },
            { icon: Bell, text: 'Send encouragement any time' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium text-text">{text}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setPlan('monthly')}
            className={`py-4 px-3 rounded-xl border-2 text-center transition-all ${
              plan === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="font-serif text-xl font-bold text-text">$5.99</p>
            <p className="text-xs text-text-secondary mt-1">per month</p>
          </button>
          <button
            onClick={() => setPlan('yearly')}
            className={`py-4 px-3 rounded-xl border-2 text-center transition-all relative ${
              plan === 'yearly' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
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
          className="block w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Redirecting to checkout...' : 'Unlock unlimited support'}
        </button>

        {error && <p className="text-sm text-danger mt-3 text-center">{error}</p>}
        <p className="text-xs text-text-secondary text-center mt-3">
          Cancel anytime. Your free encouragement was already sent.
        </p>
      </div>
    </div>
  )
}

export default function PartnerDashboard() {
  const { shareCode } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, session } = useAuth()
  const {
    profile, checkins, loading, error,
    sendNudge, nudgeSent, nudgeCooldown,
    showPaywall, setShowPaywall,
    daysSinceLastCheckin, senderProfile, freeNudgeUsed, activeGift,
  } = usePartnerData(shareCode)
  const [nudgeError, setNudgeError] = useState(null)
  const [sending, setSending] = useState(false)
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)

  // Handle return from Stripe checkout
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setSubscribeSuccess(true)
      setSearchParams({}, { replace: true })
    }
  }, [])

  async function handleNudge() {
    setSending(true)
    setNudgeError(null)
    const result = await sendNudge()
    setSending(false)
    if (result?.error && result.error !== 'paywall') {
      setNudgeError(result.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl font-bold text-text">Link not available</h1>
          <p className="mt-3 text-text-secondary leading-relaxed">
            {error || 'This share link is no longer active.'}
          </p>
          <Link
            to="/"
            className="mt-6 inline-block py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Go to QuitStreak
          </Link>
        </div>
      </div>
    )
  }

  const displayName = profile.display_name || 'Someone'
  const selfSubbed = senderProfile?.subscription_status === 'active' || senderProfile?.subscription_status === 'canceled'
  const isSubscribed = selfSubbed || !!activeGift
  const isLocked = !user

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 pt-8 pb-24">

        {/* Post-subscribe confirmation */}
        {subscribeSuccess && (
          <div className="mb-5 bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 animate-fade-in">
            <p className="font-medium text-primary">Subscription activated!</p>
            <p className="text-sm text-primary/70 mt-0.5">You can now send unlimited reminders to {displayName}.</p>
          </div>
        )}

        {/* Top bar with sign-out for authenticated supporters */}
        {user && (
          <div className="flex justify-end mb-2 -mt-2">
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-text-secondary hover:text-text transition-colors"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Journey header */}
        <div className="text-center mb-2">
          <h1 className="font-serif text-2xl font-bold text-text">
            {displayName}'s Journey
          </h1>
          <p className="text-text-secondary mt-1">
            Quitting <span className="font-medium text-primary">{TYPE_LABELS[profile.quit_type] || profile.quit_type}</span>
          </p>
        </div>

        {/* Streak counter — always visible */}
        <StreakCounter
          quitDate={profile.quit_date}
          quitType={profile.quit_type}
        />

        {isLocked ? (
          /* ─── Locked preview (unauthenticated) ─────────────────────────── */
          <>
            {/* Big signup CTA replacing the nudge button */}
            <div className="mt-6 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-primary/70" />
              </div>
              <h2 className="font-serif text-xl font-bold text-text">
                Send {displayName} encouragement
              </h2>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Create a free account to send a check-in reminder and follow {displayName}'s daily progress.
              </p>
              <Link
                to={`/?ref=${shareCode}`}
                className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Sign up to send a reminder
              </Link>
              <p className="mt-3 text-xs text-text-secondary">
                Free to join. First reminder is on us.
              </p>
            </div>

            {/* Blurred check-in history preview */}
            {checkins.length > 0 && (
              <div className="mt-6 relative">
                <div className="pointer-events-none select-none blur-sm opacity-60">
                  <CheckinHistory checkins={checkins} readOnly />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                    <Lock className="w-4 h-4 text-text-secondary" />
                    <p className="text-sm font-medium text-text">
                      Sign up to see {displayName}'s check-ins
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─── Full dashboard (authenticated) ───────────────────────────── */
          <>
            {/* Gift recipient banner */}
            {activeGift && (
              <div className="mt-4 bg-secondary/10 border border-secondary/20 rounded-xl px-5 py-4 flex items-start gap-3">
                <Gift className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-text">
                    {activeGift.gifter_name ? `${activeGift.gifter_name} gifted you unlimited support` : 'You have unlimited support'}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Send as many check-in reminders as you like — it's on them.
                  </p>
                </div>
              </div>
            )}

            {/* Days-since-checkin nudge banner */}
            {daysSinceLastCheckin !== null && daysSinceLastCheckin >= 1 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                <p className="text-sm font-medium text-amber-900">
                  {daysSinceLastCheckin === 1
                    ? `${displayName} hasn't checked in today.`
                    : `${daysSinceLastCheckin} days since ${displayName}'s last check-in.`}
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Send them a reminder to check in — it only takes a second.
                </p>
              </div>
            )}

            {/* Send encouragement */}
            <div className="mt-4">
              {nudgeSent ? (
                <div className="w-full py-4 px-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="font-medium text-primary">Reminder sent!</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {displayName} will see it next time they open the app.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleNudge}
                  disabled={sending || nudgeCooldown}
                  className="w-full py-4 px-5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending
                    ? 'Sending...'
                    : nudgeCooldown
                    ? 'Sent recently'
                    : 'Send a check-in reminder'}
                </button>
              )}
              {nudgeError && (
                <p className="text-sm text-danger mt-2 text-center">{nudgeError}</p>
              )}
              {!isSubscribed && !nudgeSent && !nudgeCooldown && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="mt-2 w-full text-xs text-primary hover:text-primary/80 text-center underline underline-offset-2"
                >
                  {freeNudgeUsed
                    ? 'Subscribe to send unlimited reminders'
                    : 'First reminder is free — subscribe for unlimited'}
                </button>
              )}
            </div>

            {/* 7-day check-in history */}
            {checkins.length > 0 && (
              <div className="mt-6">
                <CheckinHistory checkins={checkins} readOnly />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 py-3 px-6">
        <p className="text-center text-sm text-text-secondary">
          Powered by{' '}
          <Link to="/" className="font-medium text-primary hover:text-primary/80">
            QuitStreak
          </Link>
          {' '}&mdash; help someone quit for good
        </p>
      </div>

      {/* Paywall modal — authenticated supporter checkout */}
      {showPaywall && session && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          displayName={displayName}
          session={session}
          shareCode={shareCode}
          freeNudgeUsed={freeNudgeUsed}
        />
      )}
    </div>
  )
}
