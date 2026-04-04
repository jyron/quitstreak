import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wine, Cigarette, CloudFog } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
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
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [quitType, setQuitType] = useState(null)
  const [quitDate, setQuitDate] = useState(formatDateForInput(new Date()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleFinish() {
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      quit_type: quitType,
      quit_date: new Date(quitDate + 'T00:00:00').toISOString(),
    })

    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/app', { replace: true })
    }
  }

  const freeLabel = quitType === 'drinking' ? 'alcohol-free' : quitType === 'smoking' ? 'smoke-free' : 'vape-free'

  const daysIn = Math.max(0, Math.floor((Date.now() - new Date(quitDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-lg mx-auto px-6 pt-12 pb-24 w-full">
        {/* Progress dots */}
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
            <button
              onClick={() => setStep(2)}
              disabled={!quitType}
              className="mt-8 w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: When did you quit? */}
        {step === 2 && (
          <div>
            <h1 className="font-serif text-3xl font-bold text-text">When did you quit?</h1>
            <p className="mt-2 text-text-secondary">Or when are you planning to quit?</p>
            <input
              type="date"
              value={quitDate}
              max={formatDateForInput(new Date())}
              onChange={(e) => setQuitDate(e.target.value)}
              className="mt-8 w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-lg"
            />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-6 rounded-xl border border-gray-200 text-text-secondary font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-text">You're on your way.</h1>
            <div className="mt-10">
              <p className="text-text-secondary text-sm uppercase tracking-widest mb-4">
                {freeLabel} for
              </p>
              <p className="font-serif text-7xl font-bold text-text">
                {daysIn}
              </p>
              <p className="text-xl text-text-secondary mt-2">
                {daysIn === 1 ? 'day' : 'days'}
              </p>
            </div>
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
                onClick={handleFinish}
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
