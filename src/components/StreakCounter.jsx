import { useState, useEffect } from 'react'

const QUIT_DATE = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

function getElapsed(quitDate) {
  const diff = Date.now() - quitDate.getTime()

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

export default function StreakCounter() {
  const [elapsed, setElapsed] = useState(() => getElapsed(QUIT_DATE))

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(getElapsed(QUIT_DATE))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-center py-12">
      <p className="text-text-secondary text-sm uppercase tracking-widest mb-6">
        Alcohol-free for
      </p>

      <div className="font-serif text-text">
        <span className="text-7xl font-bold leading-none">{elapsed.days}</span>
        <span className="text-xl ml-2 text-text-secondary">days</span>
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
