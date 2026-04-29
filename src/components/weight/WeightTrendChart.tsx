import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { WeightEntry } from '../../types'
import { movingAverage } from '../../lib/nutritionMath'
import { subDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  entries: WeightEntry[]
}

const RANGES = [
  { label: '30T', days: 30 },
  { label: '90T', days: 90 },
  { label: '1J', days: 365 },
  { label: 'Alles', days: 0 },
]

export function WeightTrendChart({ entries }: Props) {
  const [rangeDays, setRangeDays] = useState(90)

  const chartData = useMemo(() => {
    let data = entries
    if (rangeDays > 0) {
      const cutoff = subDays(new Date(), rangeDays)
      data = entries.filter((e) => parseISO(e.date) >= cutoff)
    }
    const weights = data.map((e) => e.weightKg)
    const ma7 = movingAverage(weights, 7)
    return data.map((e, i) => ({
      date: format(parseISO(e.date), 'd. MMM', { locale: de }),
      weight: e.weightKg,
      ma7: ma7[i],
    }))
  }, [entries, rangeDays])

  if (entries.length === 0) {
    return (
      <div className="h-36 flex items-center justify-center text-sm text-gray-400">
        Noch keine Daten
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => setRangeDays(r.days)}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
              rangeDays === r.days
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(v) => [`${v} kg`]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#94a3b8"
            dot={{ r: 2, fill: '#94a3b8' }}
            strokeWidth={1}
            name="Gewicht"
          />
          <Line
            type="monotone"
            dataKey="ma7"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2.5}
            connectNulls
            name="7T-Schnitt"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-gray-400 rounded-full inline-block" />
          Tagesmessung
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-500 rounded-full inline-block" />
          7-Tage-Schnitt
        </span>
      </div>
    </div>
  )
}
