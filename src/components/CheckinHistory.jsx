import { useNavigate } from 'react-router-dom'
import FaceIcon from './FaceIcon'
import { getMood } from '../lib/checkinData'
import { Plus } from 'lucide-react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CRAVING_COLORS = {
  1: '#2D6A6A',
  2: '#2D6A6A',
  3: '#D4A053',
  4: '#C0564B',
  5: '#C0564B',
}

function getLast7Days() {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i))
  }
  return days
}

function findCheckinForDate(checkins, date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(start.getTime() + 86400000)
  return checkins.find(c => {
    const t = new Date(c.created_at)
    return t >= start && t < end
  })
}

function isToday(date) {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

export default function CheckinHistory({ checkins, readOnly = false }) {
  const navigate = useNavigate()
  const days = getLast7Days()

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">
        Recent check-ins
      </p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const checkin = findCheckinForDate(checkins, date)
          const today = isToday(date)
          const mood = checkin ? getMood(checkin.mood) : null

          return (
            <div
              key={date.toISOString()}
              className={`flex flex-col items-center gap-2 py-2 rounded-lg transition-colors ${
                today ? 'bg-primary/5' : ''
              }`}
            >
              {checkin && mood ? (
                <div className="relative">
                  <FaceIcon mood={mood} size={36} />
                  <div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: CRAVING_COLORS[checkin.craving] }}
                  />
                </div>
              ) : today && !readOnly ? (
                <button
                  onClick={() => navigate('/app/check-in')}
                  className="w-9 h-9 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors active:scale-95"
                >
                  <Plus className="w-4 h-4 text-primary/60" />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-200" />
              )}
              <span className={`text-xs ${today ? 'font-semibold text-primary' : 'text-text-secondary'}`}>
                {DAY_LABELS[date.getDay()]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
