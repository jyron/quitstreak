import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Wine, Cigarette, CloudFog, Heart, Calendar, CalendarDays } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
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

export default function Onboarding() {
  const { user } = useAuth()
  const { setProfile } = useProfile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref') || localStorage.getItem('pendingShareCode')

  // step 0 = role selection (only shown when coming from partner link)
  // step 1 = what are you quitting
  // step 2 = when did you quit
  // step 3 = confirmation
  const [step, setStep] = useState(ref ? 0 : 1)
  const [role, setRole] = useState(null) // 'supporter' | 'addict'
  const [supporterName, setSupporterName] = useState('')
  const [quitType, setQuitType] = useState(null)
  const [quitDate, setQuitDate] = useState(formatDateForInput(new Date()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function clearPendingCode() {
    localStorage.removeItem('pendingShareCode')
  }

  async function handleSupporterFinish() {
    setSaving(true)
    setError(null)

    const { data, error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: supporterName.trim() || 'A supporter',
      account_type: 'supporter',
      // quit_type left null — supporters don't track a journey
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

    const { data, error } = await supabase.from('profiles').upsert({
      id: user.id,
      account_type: 'addict',
      quit_type: quitType,
      quit_date: new Date(quitDate + 'T00:00:00').toISOString(),
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

  const freeLabel = quitType === 'drinking' ? 'alcohol-free' : quitType === 'smoking' ? 'smoke-free' : 'vape-free'
  const daysIn = Math.max(0, Math.floor((Date.now() - new Date(quitDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)))

  // Progress dots: step 0 has no dots; steps 1-3 show 3 dots
  const showDots = step >= 1 && role === 'addict'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-lg mx-auto px-6 pt-12 pb-24 w-full">
        {/* Progress dots (addict flow only) */}
        {showDots && (
          <div className="flex justify-center gap-2 mb-10">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 0: Role selection — only shown when coming from a partner link */}
        {step === 0 && (
          <div>
            <h1 className="font-serif text-3xl font-bold text-text">Welcome to QuitStreak</h1>
            <p className="mt-3 text-text-secondary leading-relaxed">
              You've been shared someone's quitting journey. Are you here to support them, or are you also working on something of your own?
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
                  className={`flex-shrink-0 mt-0.5 ${role === 'supporter' ? 'text-primary' : 'text-text-secondary'}`}
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
                  className={`flex-shrink-0 mt-0.5 ${role === 'addict' ? 'text-primary' : 'text-text-secondary'}`}
                />
                <div>
                  <p className={`text-lg font-medium ${role === 'addict' ? 'text-primary' : 'text-text'}`}>
                    I'm also tracking my own journey
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Set up your quitting streak, then view theirs too
                  </p>
                </div>
              </button>
            </div>

            {role === 'supporter' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Your name (so they know who's cheering them on)
                </label>
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
              onClick={role === 'supporter' ? handleSupporterFinish : () => setStep(1)}
              disabled={!role || saving}
              className="mt-8 w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
            >
              {saving ? 'Saving...' : role === 'supporter' ? 'Continue to their dashboard' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 1: What are you quitting? */}
        {step === 1 && (
          <div>
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
                    className={quitType === value ? 'text-primary' : 'text-text-secondary'}
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
                  onClick={() => setStep(0)}
                  className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => setStep(2)}
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
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-text">You're on your way.</h1>
            <div className="mt-10">
              <p className="text-text-secondary text-sm uppercase tracking-widest mb-4">
                {freeLabel} for
              </p>
              <p className="text-xl text-text-secondary mb-2">Day</p>
              <p className="font-serif text-7xl font-bold text-text">
                {daysIn + 1}
              </p>
            </div>
            {ref && (
              <p className="mt-6 text-sm text-text-secondary">
                You'll be taken to their dashboard after this.
              </p>
            )}
            {error && (
              <p className="mt-6 text-sm text-danger">{error}</p>
            )}
            <div className="flex gap-3 mt-10">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAddictFinish}
                disabled={saving}
                className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Start tracking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Step2QuitDate({ quitDate, setQuitDate, onBack, onContinue }) {
  const today = formatDateForInput(new Date())
  const isToday = quitDate === today

  // Max date for the picker is today
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-text">When did you quit?</h1>
      <p className="mt-2 text-text-secondary">Pick the day your streak started.</p>

      <div className="mt-8 flex flex-col gap-3">
        {/* Today option */}
        <button
          type="button"
          onClick={() => setQuitDate(today)}
          className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
            isToday ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <Calendar size={24} className={isToday ? 'text-primary' : 'text-text-secondary'} />
          <div>
            <p className={`font-medium ${isToday ? 'text-primary' : 'text-text'}`}>Today</p>
            <p className="text-sm text-text-secondary">My streak starts now</p>
          </div>
        </button>

        {/* Past date option */}
        <button
          type="button"
          onClick={() => {
            if (isToday) {
              // Default to yesterday so the date picker opens to a past date
              const yesterday = new Date()
              yesterday.setDate(yesterday.getDate() - 1)
              setQuitDate(formatDateForInput(yesterday))
            }
          }}
          className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
            !isToday ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <CalendarDays size={24} className={!isToday ? 'text-primary' : 'text-text-secondary'} />
          <div>
            <p className={`font-medium ${!isToday ? 'text-primary' : 'text-text'}`}>A date in the past</p>
            <p className="text-sm text-text-secondary">I already quit — pick when</p>
          </div>
        </button>
      </div>

      {/* Date picker — only visible when "A date in the past" is selected */}
      {!isToday && (
        <input
          type="date"
          value={quitDate}
          max={formatDateForInput(new Date())}
          min="2020-01-01"
          onChange={(e) => setQuitDate(e.target.value)}
          className="mt-4 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg"
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
