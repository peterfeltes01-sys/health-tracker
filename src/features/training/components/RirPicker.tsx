interface RirPickerProps {
  value: number | null
  onChange: (v: number | null) => void
  className?: string
}

export function RirPicker({ value, onChange, className = '' }: RirPickerProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] text-gray-400 font-medium mr-0.5">RIR</span>
      {[0, 1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all active:scale-90 ${
            value === n
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          {n === 4 ? '4+' : n}
        </button>
      ))}
    </div>
  )
}
