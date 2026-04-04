import { useNavigate } from 'react-router-dom'
import StreakCounter from '../components/StreakCounter'
import CheckinHistory from '../components/CheckinHistory'
import FaceIcon from '../components/FaceIcon'
import { useProfile } from '../hooks/useProfile'
import { useCheckins } from '../hooks/useCheckins'
import { getMood, getCravingLevel } from '../lib/checkinData'

const TYPE_LABELS = {
  drinking: 'alcohol',
  smoking: 'smoking',
  vaping: 'vaping',
}

export default function Dashboard() {
  const { profile, loading } = useProfile()
  const { checkins, loading: checkinsLoading, todayCheckin } = useCheckins()
  const navigate = useNavigate()

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  const todayMood = todayCheckin ? getMood(todayCheckin.mood) : null
  const todayCraving = todayCheckin ? getCravingLevel(todayCheckin.craving) : null

  return (
    <div className="px-6 pt-8 pb-6">
      {/* Quit context header */}
      <div className="text-center mb-2">
        <h1 className="font-serif text-2xl font-bold text-text">
          {profile.display_name !== 'Someone brave' ? `${profile.display_name}'s Journey` : 'Your Journey'}
        </h1>
        <p className="text-text-secondary mt-1">
          Quitting <span className="font-medium text-primary">{TYPE_LABELS[profile.quit_type] || profile.quit_type}</span>
        </p>
      </div>

      <StreakCounter
        quitDate={new Date(profile.quit_date)}
        quitType={profile.quit_type}
      />

      {/* Today check-in CTA / summary */}
      <div className="mt-4">
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
        <div className="mt-6">
          <CheckinHistory checkins={checkins} />
        </div>
      )}
    </div>
  )
}
