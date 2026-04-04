const MOODS = [
  { value: 1, label: 'Rough', mouth: 'M6 11 Q8 13 10 11', eyes: 'M5.5 6.5 M10.5 6.5' },
  { value: 2, label: 'Low', mouth: 'M6 10.5 Q8 12 10 10.5', eyes: 'M5.5 7 M10.5 7' },
  { value: 3, label: 'Okay', mouth: 'M6 10 L10 10', eyes: 'M5.5 6.5 M10.5 6.5' },
  { value: 4, label: 'Good', mouth: 'M6 9.5 Q8 11.5 10 9.5', eyes: 'M5.5 6.5 M10.5 6.5' },
  { value: 5, label: 'Great', mouth: 'M5.5 9 Q8 12.5 10.5 9', eyes: 'M5.5 6 M10.5 6' },
]

function FaceIcon({ mood, selected }) {
  const color = selected ? '#2D6A6A' : '#9CA3AF'
  return (
    <svg width="36" height="36" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="5.5" cy="6.5" r="1" fill={color} />
      <circle cx="10.5" cy="6.5" r="1" fill={color} />
      <path d={mood.mouth} stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function MoodSelector({ value, onChange }) {
  return (
    <div className="flex gap-3 justify-center">
      {MOODS.map((mood) => {
        const selected = value === mood.value
        return (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[60px] ${
              selected
                ? 'border-primary bg-primary/5'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <FaceIcon mood={mood} selected={selected} />
            <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-text-secondary'}`}>
              {mood.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
