import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { WorkoutSession } from '../../../types/workout'
import { computeSessionQuality } from '../../../utils/training/sessionQuality'

interface SessionQualitySparklineProps {
  sessions: WorkoutSession[]
}

function qualityColor(score: number): string {
  if (score >= 75) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

export function SessionQualitySparkline({ sessions }: SessionQualitySparklineProps) {
  const recent = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map((s) => ({
      date: s.date,
      score: s.sessionQualityScore ?? computeSessionQuality(s),
      label: format(new Date(s.date), 'd. MMM', { locale: de }),
    }))

  if (recent.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-400">
        Noch keine Sessiondaten
      </div>
    )
  }

  const latest = recent[recent.length - 1]

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{latest.score}</p>
          <p className="text-xs text-gray-400">Session-Qualität heute</p>
        </div>
        <p className="text-xs text-gray-400">Letzte 8 Wochen</p>
      </div>

      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={recent} barSize={8} barGap={2}>
          <XAxis dataKey="label" hide />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const d = payload[0].payload as (typeof recent)[number]
              return (
                <div className="bg-white dark:bg-gray-900 rounded-lg px-2 py-1 text-xs shadow border border-gray-100 dark:border-gray-800">
                  <p className="font-semibold">{d.label}</p>
                  <p className="text-primary-500">{d.score} / 100</p>
                </div>
              )
            }}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {recent.map((entry, i) => (
              <Cell key={i} fill={qualityColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
