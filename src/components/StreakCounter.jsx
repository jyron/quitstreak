import { useState, useEffect, useRef } from 'react'

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
    ring: 'border-primary/20',
    glow: 'shadow-[0_0_30px_rgba(45,106,106,0.15)]',
    bg: 'bg-primary/5',
    accent: 'text-primary',
  },
  growing: {
    ring: 'border-primary/40',
    glow: 'shadow-[0_0_40px_rgba(45,106,106,0.25)]',
    bg: 'bg-primary/8',
    accent: 'text-primary',
  },
  strong: {
    ring: 'border-secondary/50',
    glow: 'shadow-[0_0_50px_rgba(212,160,83,0.3)]',
    bg: 'bg-secondary/5',
    accent: 'text-secondary',
  },
  mature: {
    ring: 'border-secondary/70',
    glow: 'shadow-[0_0_60px_rgba(212,160,83,0.4)]',
    bg: 'bg-secondary/8',
    accent: 'text-secondary',
  },
}

export default function StreakCounter({ quitDate, quitType }) {
  const [elapsed, setElapsed] = useState(() => getElapsed(quitDate))
  const [mounted, setMounted] = useState(false)
  const [pulsing, setPulsing] = useState(false)
  const prevDayRef = useRef(null)
  const quitDateRef = useRef(quitDate)

  useEffect(() => {
    quitDateRef.current = quitDate
    setElapsed(getElapsed(quitDate))
  }, [quitDate])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const next = getElapsed(quitDateRef.current)
      // Pulse when the day number changes
      if (prevDayRef.current !== null && next.days !== prevDayRef.current) {
        setPulsing(true)
        setTimeout(() => setPulsing(false), 300)
      }
      prevDayRef.current = next.days
      setElapsed(next)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const label = TYPE_LABELS[quitType] ?? 'free'
  const dayCount = elapsed.days + 1
  const phase = getStreakPhase(dayCount)
  const styles = PHASE_STYLES[phase]

  return (
    <div className={`text-center py-12 ${mounted ? 'animate-scale-in' : 'opacity-0'}`}>
      <p className="text-text-secondary text-sm uppercase tracking-widest mb-8">
        {label} for
      </p>

      {/* Evolving ring */}
      <div className="relative inline-flex items-center justify-center">
        <div
          className={`absolute w-64 h-64 rounded-full border-4 ${styles.ring} ${styles.bg} ${styles.glow} animate-glow-pulse transition-all duration-1000`}
        />
        {phase === 'mature' && (
          <div className="absolute w-72 h-72 rounded-full border-2 border-secondary/20 animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
        )}

        <div className="relative font-serif text-text z-10">
          <span className="text-xl mr-2 text-text-secondary">Day</span>
          <span className={`text-7xl font-bold leading-none transition-transform ${pulsing ? 'animate-count-pulse' : ''}`}>
            {dayCount}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-8 font-serif text-2xl text-text">
        <div>
          <span className="font-bold tabular-nums">{String(elapsed.hours).padStart(2, '0')}</span>
          <span className="text-sm text-text-secondary ml-1">hr</span>
        </div>
        <div>
          <span className="font-bold tabular-nums">{String(elapsed.minutes).padStart(2, '0')}</span>
          <span className="text-sm text-text-secondary ml-1">min</span>
        </div>
        <div>
          <span className="font-bold tabular-nums">{String(elapsed.seconds).padStart(2, '0')}</span>
          <span className="text-sm text-text-secondary ml-1">sec</span>
        </div>
      </div>
    </div>
  )
}
