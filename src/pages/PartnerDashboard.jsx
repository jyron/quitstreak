import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, Send } from 'lucide-react'
import StreakCounter from '../components/StreakCounter'
import CheckinHistory from '../components/CheckinHistory'
import { usePartnerData } from '../hooks/usePartnerData'

const TYPE_LABELS = {
  drinking: 'alcohol',
  smoking: 'smoking',
  vaping: 'vaping',
}

export default function PartnerDashboard() {
  const { shareCode } = useParams()
  const { profile, checkins, loading, error, sendNudge, nudgeSent, nudgeCooldown } = usePartnerData(shareCode)
  const [nudgeError, setNudgeError] = useState(null)
  const [sending, setSending] = useState(false)

  async function handleNudge() {
    setSending(true)
    setNudgeError(null)
    const result = await sendNudge()
    setSending(false)
    if (result.error) {
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

  const displayName = profile.display_name !== 'Someone brave' ? profile.display_name : 'Someone'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 pt-8 pb-24">
        {/* Sign-in banner for supporters who don't have an account */}
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
          quitDate={new Date(profile.quit_date)}
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
    </div>
  )
}
