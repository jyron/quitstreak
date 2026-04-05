import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Wine, Cigarette, CloudFog, LinkIcon, Copy, Check } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

const QUIT_TYPES = [
  { value: 'drinking', label: 'Drinking', icon: Wine },
  { value: 'smoking', label: 'Smoking', icon: Cigarette },
  { value: 'vaping', label: 'Vaping', icon: CloudFog },
]

function formatDateForInput(date) {
  return date.toISOString().split('T')[0]
}

export default function Settings() {
  const { profile, updateProfile } = useProfile()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [quitType, setQuitType] = useState(profile?.quit_type ?? '')
  const [quitDate, setQuitDate] = useState(
    profile?.quit_date ? formatDateForInput(new Date(profile.quit_date)) : ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error } = await updateProfile({
      display_name: displayName || 'Someone brave',
      quit_type: quitType,
      quit_date: new Date(quitDate + 'T00:00:00').toISOString(),
    })

    setSaving(false)
    if (error) {
      setError(error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const hasChanges =
    displayName !== (profile?.display_name ?? '') ||
    quitType !== (profile?.quit_type ?? '') ||
    quitDate !== (profile?.quit_date ? formatDateForInput(new Date(profile.quit_date)) : '')

  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="font-serif text-2xl font-bold text-text mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Display name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Someone brave"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Quit type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            What are you quitting?
          </label>
          <div className="flex flex-col gap-3">
            {QUIT_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setQuitType(value)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  quitType === value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <Icon
                  size={24}
                  className={quitType === value ? 'text-primary' : 'text-text-secondary'}
                />
                <span className={`font-medium ${quitType === value ? 'text-primary' : 'text-text'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quit date */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Quit date
          </label>
          <input
            type="date"
            value={quitDate}
            max={formatDateForInput(new Date())}
            onChange={(e) => setQuitDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Share link */}
      <ShareSection profile={profile} />

      {/* Sign out */}
      <div className="mt-12 pt-6 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
        >
          Sign out
        </button>
      </div>
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
    <div className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="w-4 h-4 text-text-secondary" />
        <label className="text-sm font-medium text-text-secondary">Partner Support</label>
      </div>

      {shareUrl ? (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-text truncate font-mono flex-1">{shareUrl}</p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 rounded-lg text-primary hover:bg-primary/5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <Link
            to="/app/partner-setup"
            className="mt-2 inline-block text-sm text-primary font-medium hover:text-primary/80 transition-colors"
          >
            Manage sharing &rarr;
          </Link>
        </div>
      ) : (
        <Link
          to="/app/partner-setup"
          className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-primary/20 hover:shadow-sm transition-all"
        >
          <p className="font-medium text-text">Share your journey</p>
          <p className="text-sm text-text-secondary mt-0.5">
            Let someone you trust follow your progress.
          </p>
        </Link>
      )}
    </div>
  )
}
