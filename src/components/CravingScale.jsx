import { CRAVING_LEVELS } from '../lib/checkinData'

// Colors from low to high intensity, matching the app's palette
const COLORS = ['#2D6A6A', '#4A9A6A', '#D4A053', '#E07040', '#C0564B']

// Bar heights as a fraction of the container
const HEIGHTS = ['20%', '40%', '60%', '80%', '100%']

export default function CravingScale({ value, onChange }) {
  return (
    <div className="flex gap-3 justify-center">
      {CRAVING_LEVELS.map((level, i) => {
        const selected = value === level.value
        const color = COLORS[i]

        return (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[60px] ${
              selected ? 'border-current' : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
            style={selected ? { borderColor: color, backgroundColor: `${color}12` } : {}}
          >
            {/* Rising bar indicator */}
            <div className="w-8 h-8 rounded-md bg-gray-100 overflow-hidden flex items-end">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: HEIGHTS[i],
                  backgroundColor: color,
                  opacity: selected ? 1 : 0.35,
                }}
              />
            </div>
            <span
              className="text-xs font-medium transition-colors"
              style={selected ? { color } : { color: '#6B6B6B' }}
            >
              {level.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
