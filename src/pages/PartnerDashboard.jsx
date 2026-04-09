import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, Send, X, Lock, MessageCircle, Users, Shield } from 'lucide-react'
import StreakCounter from '../components/StreakCounter'
import CheckinHistory from '../components/CheckinHistory'
import { usePartnerData } from '../hooks/usePartnerData'
import { useAuth } from '../hooks/useAuth'

const TYPE_LABELS = {
  drinking: 'alcohol',
  smoking: 'smoking',
  vaping: 'vaping',
}

function PaywallModal({ onClose, displayName }) {
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
            You made their day!
          </h2>
          <p className="mt-2 text-text-secondary leading-relaxed">
            {displayName} saw your encouragement. Want to keep supporting them?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { icon: MessageCircle, text: 'Unlimited encouragement messages' },
            { icon: Users, text: 'Support multiple people at once' },
            { icon: Shield, text: 'Real-time progress updates' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium text-text">{text}</p>
            </div>
          ))}
        </div>

        <div className="bg-background rounded-xl p-4 mb-4">
          <div className="flex justify-between items-baseline">
            <p className="font-serif text-lg font-bold text-text">QuitStreak+</p>
            <div className="text-right">
              <p className="font-serif text-lg font-bold text-text">$5.99<span className="text-sm font-normal text-text-secondary">/mo</span></p>
              <p className="text-xs text-text-secondary">or $39.99/yr (save 44%)</p>
            </div>
          </div>
        </div>

        <Link
          to="/app/partner-setup"
          className="block w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium text-center hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          Unlock unlimited support
        </Link>

        <p className="text-xs text-text-secondary text-center mt-3">
          Cancel anytime. Your free encouragement was already sent.
        </p>
      </div>
    </div>
  )
}

export default function PartnerDashboard() {
  const { shareCode } = useParams()
  const { user } = useAuth()
  const { profile, checkins, loading, error, sendNudge, nudgeSent, nudgeCooldown, showPaywall, setShowPaywall } = usePartnerData(shareCode)
  const [nudgeError, setNudgeError] = useState(null)
  const [sending, setSending] = useState(false)

  async function handleNudge() {
    setSending(true)
    setNudgeError(null)
    const result = await sendNudge()
    setSending(false)
    if (result.error && result.error !== 'paywall') {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 pt-8 pb-24">
        {/* Sign-in banner — only shown to unauthenticated visitors */}
        {!user && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl px-5 py-4 mb-6">
            <p className="font-serif text-lg font-semibold text-text">
              {displayName} is sharing their journey with you
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to send encouragement whenever you want — they'll see it immediately.
            </p>
            <Link
              to={`/?ref=${shareCode}`}
              className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in to support {displayName} &rarr;
            </Link>
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

        {/* Streak counter */}
        <StreakCounter
          quitDate={profile.quit_date}
          quitType={profile.quit_type}
        />

        {/* Send encouragement */}
        <div className="mt-4">
          {nudgeSent ? (
            <div className="w-full py-4 px-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">Encouragement sent!</span>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                They'll see it next time they open the app.
              </p>
            </div>
          ) : (
            <button
              onClick={handleNudge}
              disabled={sending || nudgeCooldown}
              className="w-full py-4 px-5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : nudgeCooldown ? 'Sent recently' : 'Send encouragement'}
            </button>
          )}
          {nudgeError && (
            <p className="text-sm text-danger mt-2 text-center">{nudgeError}</p>
          )}
        </div>

        {/* 7-day check-in history */}
        {checkins.length > 0 && (
          <div className="mt-6">
            <CheckinHistory checkins={checkins} readOnly />
          </div>
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

      {/* Paywall modal */}
      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          displayName={displayName}
        />
      )}
    </div>
  )
}
