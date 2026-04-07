import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wine, Cigarette, CloudFog, LinkIcon, Copy, Check, AlertTriangle, Heart, LogOut, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

const QUIT_TYPES = [
  { value: 'drinking', label: 'Drinking', icon: Wine },
  { value: 'smoking', label: 'Smoking', icon: Cigarette },
  { value: 'vaping', label: 'Vaping', icon: CloudFog },
]

function formatDateForInput(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function Settings() {
  const { user } = useAuth()
  const { profile, updateProfile, setProfile } = useProfile()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [quitType, setQuitType] = useState(profile?.quit_type ?? '')
  const [quitDate, setQuitDate] = useState(
    profile?.quit_date ? formatDateForInput(new Date(profile.quit_date)) : ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const today = formatDateForInput(new Date())
    const quitTimestamp = quitDate === today
      ? new Date().toISOString()
      : new Date(quitDate + 'T00:00:00').toISOString()

    const { error } = await updateProfile({
      display_name: displayName.trim() || null,
      quit_type: quitType,
      quit_date: quitTimestamp,
    })

    setSaving(false)
    if (error) {
      setError(error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function handleResetStreak() {
    setResetting(true)
    const { error } = await updateProfile({
      quit_date: new Date().toISOString(),
    })
    setResetting(false)
    if (!error) {
      setQuitDate(formatDateForInput(new Date()))
      setShowResetModal(false)
      navigate('/app', { replace: true })
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id)

    if (!deleteError) {
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    }
    setDeleting(false)
  }

  async function handleDevResetOnboarding() {
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id)
    if (error) {
      console.error('[dev] profile reset failed:', error.message)
      return
    }
    setProfile(null)
    navigate('/app/onboarding', { replace: true })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const hasChanges =
    displayName !== (profile?.display_name ?? '') ||
    quitType !== (profile?.quit_type ?? '') ||
    quitDate !== (profile?.quit_date ? formatDateForInput(new Date(profile.quit_date)) : '')

  const currentDays = profile?.quit_date
    ? Math.floor((Date.now() - new Date(profile.quit_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0

  return (
    <div className="px-6 pt-8 pb-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-text mb-8">Settings</h1>

      {/* Profile Section */}
      <section>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3 px-1">
          Profile
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Name or nickname (optional)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
            />
          </div>

          {/* Quit type */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              What are you quitting?
            </label>
            <div className="flex gap-2">
              {QUIT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setQuitType(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all active:scale-95 ${
                    quitType === value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <Icon
                    size={22}
                    className={`transition-colors ${quitType === value ? 'text-primary' : 'text-text-secondary'}`}
                  />
                  <span className={`text-xs font-medium ${quitType === value ? 'text-primary' : 'text-text-secondary'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quit date */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Quit date
            </label>
            <input
              type="date"
              value={quitDate}
              max={formatDateForInput(new Date())}
              onChange={(e) => setQuitDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all disabled:opacity-30 active:scale-[0.98]"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Partner Support Section */}
      <section className="mt-8">
        <ShareSection profile={profile} />
      </section>

      {/* Danger Zone */}
      <section className="mt-8">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3 px-1">
          Account
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full py-4 px-5 rounded-xl border border-danger/20 bg-white text-left hover:bg-danger/5 transition-colors group"
          >
            <p className="font-medium text-danger">I need to reset my streak</p>
            <p className="text-sm text-text-secondary mt-0.5">Start fresh from today — your history stays</p>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full py-3.5 px-5 rounded-xl border border-gray-200 bg-white text-text-secondary font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 px-5 rounded-xl text-text-secondary/50 text-sm font-medium hover:text-danger hover:bg-danger/5 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete my account
          </button>

          {import.meta.env.DEV && (
            <div className="pt-3 border-t border-dashed border-amber-300">
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2 px-1">
                Dev Only
              </p>
              <button
                onClick={handleDevResetOnboarding}
                className="w-full py-3 px-5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                Reset onboarding (dev only)
              </button>
            </div>
          )}

          {user?.email && (
            <p className="mt-4 text-xs text-text-secondary/60 text-center">
              Signed in as {user.email}
            </p>
          )}
        </div>
      </section>

      {/* Reset streak modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowResetModal(false)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 mx-0 sm:mx-6 max-w-sm w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-serif text-xl font-bold text-text text-center">
              That's okay.
            </h2>
            <p className="mt-3 text-text-secondary text-center leading-relaxed">
              Slipping doesn't erase what you've done. {currentDays} {currentDays === 1 ? 'day' : 'days'} of progress is still {currentDays} {currentDays === 1 ? 'day' : 'days'} your body healed. Ready to start again?
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleResetStreak}
                disabled={resetting}
                className="w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {resetting ? 'Resetting...' : 'Reset to today'}
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="w-full py-3.5 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
              >
                Actually, I'm still going
              </button>
            </div>
            {/* Bottom safe area for sheet-style modal */}
            <div className="h-2 sm:hidden" />
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 mx-0 sm:mx-6 max-w-sm w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-danger" />
            </div>
            <h2 className="font-serif text-xl font-bold text-text text-center">
              Delete your account?
            </h2>
            <p className="mt-3 text-text-secondary text-center leading-relaxed">
              This will permanently delete all your data — your streak, check-ins, milestones, and partner links. This can't be undone.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-3.5 px-6 rounded-xl bg-danger text-white font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {deleting ? 'Deleting...' : 'Yes, delete everything'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-3.5 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
              >
                Keep my account
              </button>
            </div>
            <div className="h-2 sm:hidden" />
          </div>
        </div>
      )}
    </div>
  )
}

function ShareSection({ profile }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = profile?.share_code
    ? `${window.location.origin}/partner/${profile.share_code}`
    : null

  async function handleCopy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <>
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
        <LinkIcon className="w-3.5 h-3.5" />
        Partner Support
      </p>

      {shareUrl ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-text truncate font-mono flex-1 bg-gray-50 px-3 py-2 rounded-lg">{shareUrl}</p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2.5 rounded-lg text-primary hover:bg-primary/5 transition-colors active:scale-95"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <Link
            to="/app/partner-setup"
            className="mt-3 inline-block text-sm text-primary font-medium hover:text-primary/80 transition-colors"
          >
            Manage sharing &rarr;
          </Link>
        </div>
      ) : (
        <Link
          to="/app/partner-setup"
          className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-primary/20 hover:shadow-md transition-all"
        >
          <p className="font-medium text-text">Share your journey</p>
          <p className="text-sm text-text-secondary mt-0.5">
            Let someone you trust follow your progress.
          </p>
        </Link>
      )}
    </>
  )
}
