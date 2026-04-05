import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, X, ArrowRight, Trophy } from 'lucide-react'
import StreakCounter from '../components/StreakCounter'
import CheckinHistory from '../components/CheckinHistory'
import FaceIcon from '../components/FaceIcon'
import { useProfile } from '../hooks/useProfile'
import { useCheckins } from '../hooks/useCheckins'
import { useNudges } from '../hooks/useNudges'
import { getMood, getCravingLevel } from '../lib/checkinData'

const TYPE_LABELS = {
  drinking: 'alcohol',
  smoking: 'smoking',
  vaping: 'vaping',
}

const MILESTONES = [
  { key: '1d', label: '1 Day', days: 1 },
  { key: '3d', label: '3 Days', days: 3 },
  { key: '1w', label: '1 Week', days: 7 },
  { key: '2w', label: '2 Weeks', days: 14 },
  { key: '1m', label: '1 Month', days: 30 },
  { key: '2m', label: '2 Months', days: 60 },
  { key: '3m', label: '3 Months', days: 90 },
  { key: '6m', label: '6 Months', days: 180 },
  { key: '1y', label: '1 Year', days: 365 },
  { key: '18m', label: '18 Months', days: 547 },
  { key: '2y', label: '2 Years', days: 730 },
  { key: '5y', label: '5 Years', days: 1825 },
]

function getNextMilestone(dayCount) {
  for (const m of MILESTONES) {
    if (dayCount < m.days) return m
  }
  return null
}

function SupporterHome({ profile }) {
  const lastPartner = localStorage.getItem('pendingShareCode')

  return (
    <div className="px-6 pt-12 pb-6 flex flex-col items-center text-center animate-fade-in">
      <Heart className="w-12 h-12 text-primary/30 mb-4" />
      <h1 className="font-serif text-2xl font-bold text-text">
        {profile.display_name !== 'A supporter' && profile.display_name !== 'Someone brave'
          ? `Welcome, ${profile.display_name}`
          : 'You\'re a supporter'}
      </h1>
      <p className="mt-3 text-text-secondary leading-relaxed max-w-sm">
        You're here to support someone on their journey. You don't have a quitting streak of your own yet.
      </p>

      {lastPartner && (
        <Link
          to={`/partner/${lastPartner}`}
          className="mt-8 w-full max-w-sm py-4 px-5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          View their journey
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      <Link
        to="/app/onboarding"
        className="mt-4 w-full max-w-sm py-4 px-5 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-primary/20 hover:shadow-md transition-all"
      >
        <p className="font-medium text-text">Start your own journey</p>
        <p className="text-sm text-text-secondary mt-0.5">Track your own streak and check-ins</p>
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { profile, loading } = useProfile()
  const { checkins, loading: checkinsLoading, todayCheckin } = useCheckins()
  const { nudges, dismissNudges } = useNudges()
  const navigate = useNavigate()

  const quitDate = useMemo(() => new Date(profile?.quit_date), [profile?.quit_date])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (profile.account_type === 'supporter') {
    return <SupporterHome profile={profile} />
  }

  const todayMood = todayCheckin ? getMood(todayCheckin.mood) : null
  const todayCraving = todayCheckin ? getCravingLevel(todayCheckin.craving) : null

  const dayCount = Math.floor((Date.now() - quitDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const nextMilestone = getNextMilestone(dayCount)
  const progress = nextMilestone ? Math.min(100, Math.round((dayCount / nextMilestone.days) * 100)) : 100

  return (
    <div className="px-6 pt-8 pb-6">
      {/* Quit context header */}
      <div className="text-center mb-2 opacity-0 animate-fade-in">
        <h1 className="font-serif text-2xl font-bold text-text">
          {profile.display_name !== 'Someone brave' ? `${profile.display_name}'s Journey` : 'Your Journey'}
        </h1>
        <p className="text-text-secondary mt-1">
          Quitting <span className="font-medium text-primary">{TYPE_LABELS[profile.quit_type] || profile.quit_type}</span>
        </p>
      </div>

      <StreakCounter
        quitDate={quitDate}
        quitType={profile.quit_type}
      />

      {/* Nudge banner */}
      {nudges.length > 0 && (
        <div className="mt-4 bg-secondary/10 border border-secondary/20 rounded-xl px-5 py-4 flex items-start gap-3 opacity-0 animate-fade-in-up stagger-1">
          <Heart className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-text">
              {nudges[0].sender_name
                ? `${nudges[0].sender_name} is cheering you on!`
                : 'Someone is cheering you on!'}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">They'd love to see a check-in today.</p>
          </div>
          <button
            onClick={dismissNudges}
            className="text-text-secondary hover:text-text transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Next milestone card */}
      {nextMilestone && (
        <button
          onClick={() => navigate('/app/milestones')}
          className="w-full mt-4 py-4 px-5 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-secondary/30 hover:shadow-md transition-all opacity-0 animate-fade-in-up stagger-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">
                Next: <span className="text-secondary">{nextMilestone.label}</span>
              </p>
              <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary/70 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {nextMilestone.days - dayCount} {nextMilestone.days - dayCount === 1 ? 'day' : 'days'} to go
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Today check-in CTA / summary */}
      <div className="mt-4 opacity-0 animate-fade-in-up stagger-3">
        {todayCheckin && todayMood && todayCraving ? (
          <button
            onClick={() => navigate('/app/check-in')}
            className="w-full py-4 px-5 rounded-xl bg-primary/5 border border-primary/10 text-left hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <FaceIcon mood={todayMood} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">Checked in today</span>
                  <span className="text-xs text-text-secondary">·</span>
                  <span className="text-xs text-text-secondary">{todayCraving.label} cravings</span>
                </div>
                {todayCheckin.note && (
                  <p className="text-sm text-text-secondary mt-0.5 truncate">{todayCheckin.note}</p>
                )}
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => navigate('/app/check-in')}
            className="w-full py-4 px-6 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-primary/20 hover:shadow-md transition-all"
          >
            <p className="font-medium text-text">How are you feeling?</p>
            <p className="text-sm text-text-secondary mt-0.5">Log today's mood and cravings</p>
          </button>
        )}
      </div>

      {/* 7-day check-in history */}
      {!checkinsLoading && (
        <div className="mt-6 opacity-0 animate-fade-in-up stagger-4">
          <CheckinHistory checkins={checkins} />
        </div>
      )}
    </div>
  )
}
