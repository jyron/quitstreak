import { useNavigate } from 'react-router-dom'
import StreakCounter from '../components/StreakCounter'
import { useProfile } from '../hooks/useProfile'

export default function Dashboard() {
  const { profile, loading } = useProfile()
  const navigate = useNavigate()

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="px-6 pt-12">
      <StreakCounter
        quitDate={new Date(profile.quit_date)}
        quitType={profile.quit_type}
      />

      {/* Check-in CTA */}
      <div className="mt-4">
        <button
          onClick={() => navigate('/app/check-in')}
          className="w-full py-4 px-6 rounded-xl bg-white border border-gray-100 shadow-sm text-left hover:border-primary/20 hover:shadow-md transition-all"
        >
          <p className="font-medium text-text">How are you feeling?</p>
          <p className="text-sm text-text-secondary mt-0.5">Log today's mood and cravings</p>
        </button>
      </div>
    </div>
  )
}
