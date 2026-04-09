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
  // (they came here from a partner dashboard link)
  if (ref && profile) {
    return <Navigate to={`/partner/${ref}`} replace />
  }

  // Profile not yet created — send back to landing to complete onboarding
  if (profile === null) {
    const landingPath = ref ? `/?ref=${ref}` : '/'
    return <Navigate to={landingPath} replace />
  }

  return children
}
