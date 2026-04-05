import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

export default function RequireAuth({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // If there's a ?ref param and the user has a profile, redirect to the partner dashboard
  // (they came here via magic link from a partner dashboard)
  if (ref && profile) {
    return <Navigate to={`/partner/${ref}`} replace />
  }

  // Supporters have a profile but no quit journey — they're allowed through to /app
  // (Dashboard.jsx will show them the supporter home view)
  if (profile?.account_type === 'supporter') {
    // Don't send supporters to onboarding; they're set up already
    if (location.pathname === '/app/onboarding') {
      return <Navigate to="/app" replace />
    }
    return children
  }

  // Profile exists (addict) — don't let user linger on onboarding
  if (profile && location.pathname === '/app/onboarding') {
    return <Navigate to="/app" replace />
  }

  // Profile not yet created — send to onboarding, preserving ?ref if present
  if (profile === null && location.pathname !== '/app/onboarding') {
    const onboardingPath = ref ? `/app/onboarding?ref=${ref}` : '/app/onboarding'
    return <Navigate to={onboardingPath} replace />
  }

  return children
}
