import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Heart, X, ArrowRight, Trophy, Pencil, Users, Send } from 'lucide-react'
import StreakCounter from '../components/StreakCounter'
import Confetti from '../components/Confetti'
import CheckinHistory from '../components/CheckinHistory'
import FaceIcon from '../components/FaceIcon'
import { useProfile } from '../hooks/useProfile'
import { useCheckins } from '../hooks/useCheckins'
import { useNudges } from '../hooks/useNudges'
import { useSupportedPeople } from '../hooks/useSupportedPeople'
import { useSupporters } from '../hooks/useSupporters'
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

function getDayCount(quitDate) {
  return Math.floor((Date.now() - new Date(quitDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function SupporterHome({ profile }) {
  const { people, loading } = useSupportedPeople()
  const lastPartner = localStorage.getItem('pendingShareCode')

  const hasName = !!profile.display_name

  return (
    <div className="px-6 pt-12 pb-6 flex flex-col items-center animate-fade-in">
      <Heart className="w-12 h-12 text-primary/30 mb-4" />
      <h1 className="font-serif text-2xl font-bold text-text text-center">
        {hasName ? `Welcome, ${profile.display_name}` : "You're a supporter"}
      </h1>
      <p className="mt-3 text-text-secondary leading-relaxed max-w-sm text-center">
        You're here to support someone on their journey.
      </p>

      <div className="mt-8 w-full max-w-sm flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading-spinner" />
          </div>
        ) : people.length > 0 ? (
          <>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider px-1">
              People you support
            </p>
            {people.map(person => {
              const displayName = person.display_name || 'Someone'
              const dayCount = person.quit_date ? getDayCount(person.quit_date) : null

              if (!person.share_active) {
                return (
                  <div
                    key={person.share_code}
                    className="w-full py-4 px-5 rounded-xl bg-white border border-gray-100 opacity-50"
                  >
                    <p className="font-medium text-text">{displayName}'s Journey</p>
                    <p className="text-sm text-text-secondary mt-0.5">Sharing paused</p>
                  </div>
                )
              }

              return (
                <Link
                  key={person.share_code}
                  to={`/partner/${person.share_code}`}
                  className="w-full py-4 px-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-primary/20 hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-text">{displayName}'s Journey</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Quitting {TYPE_LABELS[person.quit_type] || person.quit_type}
                      {dayCount !== null && <> · Day {dayCount}</>}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
                </Link>
              )
            })}
          </>
        ) : (
          <>
            {lastPartner && (
              <Link
                to={`/partner/${lastPartner}`}
                className="w-full py-4 px-5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                View their journey
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {!lastPartner && (
              <p className="text-sm text-text-secondary text-center py-2">
                Visit someone's share link to start supporting them.
              </p>
            )}
          </>
        )}

        <Link
          to="/app/onboarding"
          className="w-full py-4 px-5 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-primary/20 hover:shadow-md transition-all"
        >
          <p className="font-medium text-text">Start your own journey</p>
          <p className="text-sm text-text-secondary mt-0.5">Track your own streak and check-ins</p>
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, loading } = useProfile()
  const { checkins, loading: checkinsLoading, todayCheckin } = useCheckins()
  const { nudges, dismissNudges } = useNudges()
  const { supporters, loading: supportersLoading } = useSupporters(profile?.share_code)
  const navigate = useNavigate()
  const [showConfetti, setShowConfetti] = useState(false)

  const quitDate = profile?.quit_date

  useEffect(() => {
    if (sessionStorage.getItem('showConfetti') === '1') {
      sessionStorage.removeItem('showConfetti')
      setShowConfetti(true)
    }
  }, [])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (profile.account_type === 'supporter') {
    return <SupporterHome profile={profile} />
  }

  const todayMood = todayCheckin ? getMood(todayCheckin.mood) : null
  const todayCraving = todayCheckin ? getCravingLevel(todayCheckin.craving) : null

  const dayCount = Math.floor((Date.now() - new Date(quitDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  const nextMilestone = getNextMilestone(dayCount)
  const progress = nextMilestone ? Math.min(100, Math.round((dayCount / nextMilestone.days) * 100)) : 100

  const displayName = profile.display_name || null
  const greeting = getGreeting()

  return (
    <div className="px-6 pt-8 pb-6">
      {showConfetti && <Confetti />}
      {/* Greeting header */}
      <div className="text-center mb-2 opacity-0 animate-fade-in">
        <h1 className="font-serif text-2xl font-bold text-text">
          {displayName ? `${greeting}, ${displayName.split(' ')[0]}` : `${greeting}`}
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
            className="text-text-secondary hover:text-text transition-colors flex-shrink-0 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Next milestone card */}
      {nextMilestone && (
        <button
          onClick={() => navigate('/app/milestones')}
          className="w-full mt-5 py-4 px-5 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-secondary/30 hover:shadow-md transition-all opacity-0 animate-fade-in-up stagger-2"
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
      <div className="mt-5 opacity-0 animate-fade-in-up stagger-3">
        {todayCheckin && todayMood && todayCraving ? (
          <button
            onClick={() => navigate('/app/check-in')}
            className="w-full py-4 px-5 rounded-xl bg-primary/5 border border-primary/10 text-left hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <FaceIcon mood={todayMood} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">Checked in today</span>
                  <span className="text-xs text-text-secondary">· {todayCraving.label} cravings</span>
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
            className="w-full py-4 px-5 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-primary/20 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text">How are you feeling?</p>
                <p className="text-sm text-text-secondary mt-0.5">Log today's mood and cravings</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* 7-day check-in history */}
      {!checkinsLoading && (
        <div className="mt-6 opacity-0 animate-fade-in-up stagger-4">
          <CheckinHistory checkins={checkins} />
        </div>
      )}

      {/* Your supporters */}
      {!supportersLoading && supporters.length > 0 && (
        <div className="mt-6 opacity-0 animate-fade-in-up stagger-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider px-1 mb-3">
            Your Supporters
          </p>
          <div className="flex flex-wrap gap-2">
            {supporters.map(s => (
              <div
                key={s.id}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-all ${
                  s.has_encouraged
                    ? 'bg-secondary/5 border-secondary/20'
                    : 'bg-white border-gray-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  s.has_encouraged ? 'bg-secondary' : 'bg-primary/60'
                }`}>
                  {(s.display_name || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-text">{s.display_name || 'Someone'}</span>
                {s.has_encouraged && (
                  <Heart className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA to share link if no supporters and subscribed */}
      {!supportersLoading && supporters.length === 0 && profile.share_code && (
        <div className="mt-6 opacity-0 animate-fade-in-up stagger-5">
          <button
            onClick={() => navigate('/app/partner-setup')}
            className="w-full py-4 px-5 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-primary/20 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text">Share your journey</p>
                <p className="text-sm text-text-secondary mt-0.5">Invite someone to follow your progress</p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
