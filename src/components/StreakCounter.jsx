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

export default function StreakCounter({ quitDate, quitType }) {
  const [elapsed, setElapsed] = useState(() => getElapsed(quitDate))
  const quitDateRef = useRef(quitDate)

  // Keep the ref current and immediately reflect any quitDate prop change
  useEffect(() => {
    quitDateRef.current = quitDate
    setElapsed(getElapsed(quitDate))
  }, [quitDate])

  // Interval starts once on mount and never restarts due to re-renders.
  // Reads quitDate via ref so it always uses the latest value.
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(getElapsed(quitDateRef.current))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const label = TYPE_LABELS[quitType] ?? 'free'

  return (
    <div className="text-center py-12">
      <p className="text-text-secondary text-sm uppercase tracking-widest mb-6">
        {label} for
      </p>

      <div className="font-serif text-text">
        <span className="text-xl mr-2 text-text-secondary">Day</span>
        <span className="text-7xl font-bold leading-none">{elapsed.days + 1}</span>
      </div>

      <div className="flex justify-center gap-6 mt-6 font-serif text-2xl text-text">
        <div>
          <span className="font-bold">{String(elapsed.hours).padStart(2, '0')}</span>
          <span className="text-sm text-text-secondary ml-1">hr</span>
        </div>
        <div>
          <span className="font-bold">{String(elapsed.minutes).padStart(2, '0')}</span>
          <span className="text-sm text-text-secondary ml-1">min</span>
        </div>
        <div>
          <span className="font-bold">{String(elapsed.seconds).padStart(2, '0')}</span>
          <span className="text-sm text-text-secondary ml-1">sec</span>
        </div>
      </div>
    </div>
  )
}
