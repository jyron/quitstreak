import { Check } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'

const MILESTONES = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
  { days: 90, label: '3 Months' },
  { days: 180, label: '6 Months' },
  { days: 365, label: '1 Year' },
]

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Milestones() {
  const { profile, loading } = useProfile()

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  const quitDate = new Date(profile.quit_date)
  const now = Date.now()
  const elapsedDays = Math.floor((now - quitDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="font-serif text-2xl font-bold text-text mb-2">Milestones</h1>
      <p className="text-text-secondary mb-8">Day {elapsedDays} of your journey</p>

      <div className="space-y-4">
        {MILESTONES.map(({ days, label }) => {
          const reached = elapsedDays >= days
          const milestoneDate = addDays(quitDate, days - 1)

          return (
            <div
              key={days}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                reached
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  reached
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-secondary'
                }`}
              >
                {reached ? (
                  <Check size={20} strokeWidth={2.5} />
                ) : (
                  <span className="text-sm font-medium">{days}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${reached ? 'text-primary' : 'text-text'}`}>
                  {label}
                </p>
                <p className="text-sm text-text-secondary">
                  {reached ? `Reached ${formatDate(milestoneDate)}` : formatDate(milestoneDate)}
                </p>
              </div>
              {reached && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Done
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
