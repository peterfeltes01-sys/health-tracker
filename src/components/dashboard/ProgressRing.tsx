interface ProgressRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label: string
  sublabel?: string
  icon?: string
}

export function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 10,
  color = '#26a469',
  label,
  sublabel,
  icon,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(1, value / max)
  const offset = circumference * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100 dark:text-gray-800"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <span className="text-xl mb-0.5">{icon}</span>}
          <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">{label}</span>
          {sublabel && <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sublabel}</span>}
        </div>
        {pct >= 1 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center text-white text-[10px]">
            ✓
          </div>
        )}
      </div>
    </div>
  )
}
