import { MOODS } from '../lib/checkinData'
import FaceIcon from './FaceIcon'

export default function MoodSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-center">
      {MOODS.map((mood) => {
        const selected = value === mood.value
        return (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            className={`flex-1 flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl border-2 transition-all active:scale-95 ${
              selected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <FaceIcon mood={mood} size={32} color={selected ? '#2D6A6A' : '#9CA3AF'} />
            <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-text-secondary'}`}>
              {mood.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
