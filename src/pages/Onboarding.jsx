import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Wine, Cigarette, CloudFog, Heart, Calendar, CalendarDays, UserCircle, Pencil, Trophy, Flame, Sparkles, Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

const DEV_EMAIL = 'test@jyron.com'

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

function OnboardingIllustration({ step, quitType }) {
  const iconForQuit = QUIT_TYPES.find((q) => q.value === quitType)?.icon

  if (step === 1) {
    const Icon = iconForQuit || Sparkles
    return (
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center ${iconForQuit ? 'animate-scale-in' : ''}`}>
          <Icon size={40} className="text-primary/60" />
        </div>
        {iconForQuit && (
          <div className="absolute -top-1 -right-1 animate-fade-in">
            <Sparkles size={18} className="text-secondary animate-float" />
          </div>
        )}
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarDays size={40} className="text-primary/40 animate-float" />
        </div>
        <div className="absolute -bottom-1 -right-1">
          <Clock size={18} className="text-primary/30" />
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <UserCircle size={40} className="text-primary/30" />
        </div>
        <div className="absolute -top-1 -right-1 animate-fade-in">
          <Pencil size={16} className="text-primary/40 animate-float" />
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="relative w-32 h-24 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute left-2 top-2 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Flame size={20} className="text-secondary/40 animate-float" />
        </div>
        <div className="opacity-0 animate-scale-in" style={{ animationDelay: '0.15s' }}>
          <Trophy size={44} className="text-secondary" />
        </div>
        <div className="absolute right-2 top-2 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Flame size={20} className="text-secondary/40 animate-float" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>
    )
  }

  // Step 0 (role selection)
  return (
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
      <Heart size={40} className="text-primary/30" />
    </div>
  )
}

export default function Onboarding() {
  const { user } = useAuth()
  const { setProfile } = useProfile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref') || localStorage.getItem('pendingShareCode')

  const [step, setStep] = useState(ref ? 0 : 1)
  const [role, setRole] = useState(null)
  const [supporterName, setSupporterName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [quitType, setQuitType] = useState(null)
  const [quitDate, setQuitDate] = useState(formatDateForInput(new Date()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [animating, setAnimating] = useState(false)

  function goToStep(next) {
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 200)
  }

  function clearPendingCode() {
    localStorage.removeItem('pendingShareCode')
  }

  async function handleSupporterFinish() {
    setSaving(true)
    setError(null)

    const { data, error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: supporterName.trim() || null,
      account_type: 'supporter',
    }, { onConflict: 'id' }).select().single()

    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setProfile(data)
      clearPendingCode()
      if (ref) {
        navigate(`/partner/${ref}`, { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    }
  }

  async function handleAddictFinish() {
    setSaving(true)
    setError(null)

    const today = formatDateForInput(new Date())
    const quitTimestamp = quitDate === today
      ? new Date().toISOString()
      : new Date(quitDate + 'T00:00:00').toISOString()

    const { data, error } = await supabase.from('profiles').upsert({
      id: user.id,
      account_type: 'addict',
      display_name: displayName.trim() || null,
      quit_type: quitType,
      quit_date: quitTimestamp,
    }, { onConflict: 'id' }).select().single()

    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setProfile(data)
      clearPendingCode()
      sessionStorage.setItem('showConfetti', '1')
      if (ref) {
        navigate(`/partner/${ref}`, { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    }
  }

  const freeLabel = quitType === 'drinking' ? 'alcohol-free' : quitType === 'smoking' ? 'smoke-free' : 'vape-free'
  const daysIn = Math.max(0, Math.floor((Date.now() - new Date(quitDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)))

  const showDots = step >= 1 && (role === 'addict' || !ref)
  const totalSteps = 4

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-lg mx-auto px-6 pt-12 pb-24 w-full">
        {/* Progress dots */}
        {showDots && (
          <div className="flex justify-center gap-2 mb-10">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  s === step ? 'bg-primary scale-125' : s < step ? 'bg-primary/40' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Animated step container */}
        <div
          className={`transition-all duration-200 ${
            animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Step 0: Role selection (share-code only) */}
          {step === 0 && (
            <div className="animate-fade-in">
              <OnboardingIllustration step={0} />
              <h1 className="font-serif text-3xl font-bold text-text">Welcome to QuitStreak</h1>
              <p className="mt-3 text-text-secondary leading-relaxed">
                You got someone's link. Are you here to cheer them on, or tracking something of your own?
              </p>
              <div className="mt-8 flex flex-col gap-4">
                <button
                  onClick={() => setRole('supporter')}
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                    role === 'supporter'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <Heart
                    size={28}
                    className={`flex-shrink-0 mt-0.5 transition-colors ${role === 'supporter' ? 'text-primary' : 'text-text-secondary'}`}
                  />
                  <div>
                    <p className={`text-lg font-medium ${role === 'supporter' ? 'text-primary' : 'text-text'}`}>
                      I'm here to support someone
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Follow their progress and send encouragement
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setRole('addict')}
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                    role === 'addict'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <Calendar
                    size={28}
                    className={`flex-shrink-0 mt-0.5 transition-colors ${role === 'addict' ? 'text-primary' : 'text-text-secondary'}`}
                  />
                  <div>
                    <p className={`text-lg font-medium ${role === 'addict' ? 'text-primary' : 'text-text'}`}>
                      I'm also tracking my own journey
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Set up your streak, then view theirs too
                    </p>
                  </div>
                </button>
              </div>

              {role === 'supporter' && (
                <div className="mt-6 animate-fade-in">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    What should we call you?
                  </label>
                  <p className="text-xs text-text-secondary/70 mb-2">
                    So they know who's cheering them on.
                  </p>
                  <input
                    type="text"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder="e.g. Mom, Jake, Coach Sarah"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              )}

              {error && <p className="mt-4 text-sm text-danger">{error}</p>}

              <button
                onClick={role === 'supporter' ? handleSupporterFinish : () => goToStep(1)}
                disabled={!role || saving || (role === 'supporter' && !supporterName.trim())}
                className="mt-8 w-full py-3.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30 active:scale-[0.98]"
              >
                {saving ? 'Saving...' : role === 'supporter' ? 'Continue to their dashboard' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 1: What are you quitting? */}
          {step === 1 && (
            <div className="animate-fade-in">
              <OnboardingIllustration step={1} quitType={quitType} />
              <h1 className="font-serif text-3xl font-bold text-text">What are you quitting?</h1>
              <div className="mt-8 flex flex-col gap-4">
                {QUIT_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setQuitType(value)}
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                      quitType === value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <Icon
                      size={28}
                      className={`transition-colors ${quitType === value ? 'text-primary' : 'text-text-secondary'}`}
                    />
                    <span className={`text-lg font-medium ${quitType === value ? 'text-primary' : 'text-text'}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                {ref && (
                  <button
                    onClick={() => goToStep(0)}
                    className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => goToStep(2)}
                  disabled={!quitType}
                  className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: When did you quit? */}
          {step === 2 && (
            <Step2QuitDate
              quitDate={quitDate}
              setQuitDate={setQuitDate}
              onBack={() => goToStep(1)}
              onContinue={() => goToStep(3)}
            />
          )}

          {/* Step 3: What should we call you? */}
          {step === 3 && (
            <div className="animate-fade-in">
              <OnboardingIllustration step={3} />
              <h1 className="font-serif text-3xl font-bold text-text">What should we call you?</h1>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Just a first name or nickname. Your supporters will see this when they cheer you on.
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name or nickname"
                className="mt-6 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg"
              />
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => goToStep(2)}
                  className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => goToStep(4)}
                  disabled={!displayName.trim()}
                  className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center">
              <OnboardingIllustration step={4} />
              <h1 className="font-serif text-3xl font-bold text-text animate-fade-in">Locked in.</h1>
              <div className="mt-10 opacity-0 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <p className="font-serif text-8xl font-bold text-text">
                  {daysIn + 1}
                </p>
                <p className="text-lg text-text-secondary font-medium mt-2">
                  {daysIn + 1 === 1 ? 'day' : 'days'} {freeLabel}
                </p>
              </div>
              {ref && (
                <p className="mt-6 text-sm text-text-secondary opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  You'll see their dashboard next.
                </p>
              )}
              {error && (
                <p className="mt-6 text-sm text-danger">{error}</p>
              )}
              <div className="flex gap-3 mt-10 opacity-0 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <button
                  onClick={() => goToStep(3)}
                  className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAddictFinish}
                  disabled={saving}
                  className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : "Let's go"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {user?.email === DEV_EMAIL && <DevResetButton />}
    </div>
  )
}

function DevResetButton() {
  const { user } = useAuth()
  const { setProfile } = useProfile()
  const navigate = useNavigate()

  async function handleReset() {
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    if (error) {
      console.error('[dev] profile reset failed:', error.message)
      return
    }
    setProfile(null)
    navigate('/app/onboarding', { replace: true })
  }

  return (
    <button
      onClick={handleReset}
      className="fixed bottom-6 right-4 px-3 py-1.5 rounded-full bg-amber-500/90 text-white text-xs font-medium shadow-md hover:bg-amber-600 transition-colors z-50"
    >
      Reset onboarding
    </button>
  )
}

function Step2QuitDate({ quitDate, setQuitDate, onBack, onContinue }) {
  const today = formatDateForInput(new Date())
  const isToday = quitDate === today

  return (
    <div className="animate-fade-in">
      <OnboardingIllustration step={2} />
      <h1 className="font-serif text-3xl font-bold text-text">When did you quit?</h1>
      <p className="mt-2 text-text-secondary">Pick the day your streak started.</p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setQuitDate(today)}
          className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
            isToday ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <Calendar size={24} className={`transition-colors ${isToday ? 'text-primary' : 'text-text-secondary'}`} />
          <div>
            <p className={`font-medium ${isToday ? 'text-primary' : 'text-text'}`}>Today</p>
            <p className="text-sm text-text-secondary">My streak starts now</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isToday) {
              const yesterday = new Date()
              yesterday.setDate(yesterday.getDate() - 1)
              setQuitDate(formatDateForInput(yesterday))
            }
          }}
          className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
            !isToday ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <CalendarDays size={24} className={`transition-colors ${!isToday ? 'text-primary' : 'text-text-secondary'}`} />
          <div>
            <p className={`font-medium ${!isToday ? 'text-primary' : 'text-text'}`}>A date in the past</p>
            <p className="text-sm text-text-secondary">I already quit — pick when</p>
          </div>
        </button>
      </div>

      {!isToday && (
        <input
          type="date"
          value={quitDate}
          max={formatDateForInput(new Date())}
          min="2020-01-01"
          onChange={(e) => setQuitDate(e.target.value)}
          className="mt-4 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg animate-fade-in"
        />
      )}

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
