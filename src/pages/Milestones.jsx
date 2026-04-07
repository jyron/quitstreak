import { useState, useEffect } from 'react'
import { Check, Trophy, X, Star } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import Confetti from '../components/Confetti'

const MILESTONES = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
  { days: 60, label: '2 Months' },
  { days: 90, label: '3 Months' },
  { days: 180, label: '6 Months' },
  { days: 365, label: '1 Year' },
  { days: 547, label: '18 Months' },
  { days: 730, label: '2 Years' },
  { days: 1825, label: '5 Years' },
]

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getNextMilestone(dayCount) {
  for (const m of MILESTONES) {
    if (dayCount < m.days) return m
  }
  return null
}

function CelebrationOverlay({ milestone, onClose }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setShow(true))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <Confetti />

      <div
        className={`relative bg-white rounded-2xl shadow-xl p-8 mx-6 max-w-sm w-full text-center transition-all duration-500 ${
          show ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text transition-colors p-1"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4 animate-scale-in">
          <Trophy className="w-8 h-8 text-secondary" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-text">
          {milestone.label}!
        </h2>
        <p className="mt-3 text-text-secondary leading-relaxed">
          You made it. {milestone.days === 1 ? 'The first day is always the hardest.' : `${milestone.label} of real progress.`} Be proud of yourself.
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          Keep going
        </button>
      </div>
    </div>
  )
}

export default function Milestones() {
  const { profile, loading } = useProfile()
  const [celebration, setCelebration] = useState(null)

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    )
  }

  const quitDate = new Date(profile.quit_date)
  const now = Date.now()
  const elapsedDays = Math.floor((now - quitDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const nextMilestone = getNextMilestone(elapsedDays)
  const progress = nextMilestone ? Math.min(100, Math.round((elapsedDays / nextMilestone.days) * 100)) : 100

  // Find first reached milestone index for the "tap to celebrate" hint
  const firstReachedIndex = MILESTONES.findIndex(m => elapsedDays >= m.days)
  const hasReachedAny = firstReachedIndex >= 0

  return (
    <div className="px-6 pt-8 pb-6">
      <div className="animate-fade-in">
        <h1 className="font-serif text-2xl font-bold text-text mb-1">Milestones</h1>
        <p className="text-text-secondary">Day {elapsedDays} of your journey</p>
      </div>

      {/* Next milestone progress */}
      {nextMilestone && (
        <div className="mt-6 p-5 rounded-xl bg-white border border-gray-100 shadow-sm opacity-0 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-secondary" />
            </div>
            <p className="font-medium text-text">
              Next: <span className="text-secondary">{nextMilestone.label}</span>
            </p>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-2">
            {nextMilestone.days - elapsedDays} {nextMilestone.days - elapsedDays === 1 ? 'day' : 'days'} to go — {progress}% there
          </p>
        </div>
      )}

      {/* Milestone timeline */}
      <div className="mt-6 relative">
        {/* Vertical connector line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gray-100" />

        <div className="space-y-2.5">
          {MILESTONES.map(({ days, label }, i) => {
            const reached = elapsedDays >= days
            const isNext = nextMilestone && days === nextMilestone.days
            const milestoneDate = addDays(quitDate, days - 1)
            const isFirstReached = hasReachedAny && i === firstReachedIndex

            return (
              <div
                key={days}
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all opacity-0 animate-fade-in-up ${
                  reached
                    ? 'border-primary/20 bg-primary/5 cursor-pointer hover:border-primary/30 active:scale-[0.99]'
                    : isNext
                      ? 'border-secondary/30 bg-secondary/5'
                      : 'border-gray-100 bg-white'
                } ${!reached && !isNext ? 'opacity-70' : ''}`}
                style={{ animationDelay: `${0.05 * i + 0.2}s` }}
                onClick={reached ? () => setCelebration({ days, label }) : undefined}
              >
                {/* Icon */}
                <div
                  className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    reached
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : isNext
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-gray-100 text-text-secondary'
                  }`}
                >
                  {reached ? (
                    <Check size={20} strokeWidth={2.5} />
                  ) : isNext ? (
                    <Star size={16} />
                  ) : (
                    <span className="text-xs font-medium">{days}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${reached ? 'text-primary' : isNext ? 'text-secondary' : 'text-text'}`}>
                    {label}
                  </p>
                  <p className={`text-sm ${reached || isNext ? 'text-text-secondary' : 'text-text-secondary/70'}`}>
                    {reached
                      ? `Reached ${formatDate(milestoneDate)}`
                      : isNext
                        ? `${nextMilestone.days - elapsedDays} days away`
                        : formatDate(milestoneDate)
                    }
                  </p>
                </div>

                {/* Badge */}
                {reached && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {isFirstReached ? 'Tap to celebrate' : 'Earned'}
                  </span>
                )}
                {isNext && (
                  <span className="text-xs font-medium text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
                    Next
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationOverlay
          milestone={celebration}
          onClose={() => setCelebration(null)}
        />
      )}
    </div>
  )
}
