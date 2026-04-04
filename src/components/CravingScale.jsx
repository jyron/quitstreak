const LEVELS = [
  { value: 1, label: 'None' },
  { value: 2, label: 'Mild' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Strong' },
  { value: 5, label: 'Overwhelming' },
]

export default function CravingScale({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {LEVELS.map((level) => {
        const selected = value === level.value
        return (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={`px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
              selected
                ? 'border-primary bg-primary text-white'
                : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300'
            }`}
          >
            {level.label}
          </button>
        )
      })}
    </div>
  )
}
