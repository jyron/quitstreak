import { useState, useEffect, useMemo } from 'react'

const TYPE_LABELS = {
  drinking: 'alcohol-free',
  smoking: 'smoke-free',
  vaping: 'vape-free',
}

function getElapsed(quitDate) {
  const diff = Math.max(0, Date.now() - quitDate.getTime())

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  }
}

function getStreakPhase(days) {
  if (days <= 7) return 'seedling'
  if (days <= 30) return 'growing'
  if (days <= 90) return 'strong'
  return 'mature'
}

const PHASE_STYLES = {
  seedling: {
    glow: 'shadow-[0_0_30px_rgba(45,106,106,0.15)]',
    bg: 'bg-primary/5',
  },
  growing: {
    glow: 'shadow-[0_0_40px_rgba(45,106,106,0.25)]',
    bg: 'bg-primary/8',
  },
  strong: {
    glow: 'shadow-[0_0_50px_rgba(212,160,83,0.3)]',
    bg: 'bg-secondary/5',
  },
  mature: {
    glow: 'shadow-[0_0_60px_rgba(212,160,83,0.4)]',
    bg: 'bg-secondary/8',
  },
}

export default function StreakCounter({ quitDate: quitDateStr, quitType }) {
  const quitDate = useMemo(() => {
    const d = new Date(quitDateStr)
    return isNaN(d.getTime()) ? null : d
  }, [quitDateStr])

  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!quitDate) return

    setElapsed(getElapsed(quitDate))

    let prevDays = getElapsed(quitDate).days

    const id = setInterval(() => {
      const next = getElapsed(quitDate)
      if (next.days !== prevDays) {
        setPulsing(true)
        setTimeout(() => setPulsing(false), 300)
      }
      prevDays = next.days
      setElapsed(next)
    }, 1000)

    return () => clearInterval(id)
  }, [quitDate])

  const label = TYPE_LABELS[quitType] ?? 'free'
  const dayCount = elapsed.days + 1
  const phase = getStreakPhase(dayCount)
  const styles = PHASE_STYLES[phase]

  return (
    <div className={`text-center py-10 ${mounted ? 'animate-scale-in' : 'opacity-0'}`}>
      {/* Evolving ring */}
      <div className="relative inline-flex items-center justify-center">
        <div
          className={`absolute w-56 h-56 rounded-full ${styles.bg} ${styles.glow} animate-glow-pulse transition-all duration-1000`}
        />
        {phase === 'mature' && (
          <div className="absolute w-64 h-64 rounded-full animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        )}

        <div className="relative font-serif text-text z-10">
          <span className={`text-8xl font-bold leading-none transition-transform ${pulsing ? 'animate-count-pulse' : ''}`}>
            {dayCount}
          </span>
          <p className="text-lg text-text-secondary font-medium mt-2">
            {dayCount === 1 ? 'day' : 'days'} {label}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-8 text-text">
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-2xl font-bold tabular-nums">{String(elapsed.hours).padStart(2, '0')}</span>
          <span className="text-xs text-text-secondary font-medium">hr</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-2xl font-bold tabular-nums">{String(elapsed.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-text-secondary font-medium">min</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-2xl font-bold tabular-nums">{String(elapsed.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-text-secondary font-medium">sec</span>
        </div>
      </div>
    </div>
  )
}
