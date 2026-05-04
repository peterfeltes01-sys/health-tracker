import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { BodyMeasurementEntry } from '../../types'
import { subDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  entries: BodyMeasurementEntry[]
}

const RANGES = [
  { label: '30T', days: 30 },
  { label: '90T', days: 90 },
  { label: '1J', days: 365 },
  { label: 'Alles', days: 0 },
]

export function BodyTrendChart({ entries }: Props) {
  const [rangeDays, setRangeDays] = useState(90)

  const chartData = (() => {
    let data = entries
    if (rangeDays > 0) {
      const cutoff = subDays(new Date(), rangeDays)
      data = entries.filter((e) => parseISO(e.date) >= cutoff)
    }
    return data.map((e) => ({
      date: format(parseISO(e.date), 'd. MMM', { locale: de }),
      waist: e.waistCm ?? null,
      hip: e.hipCm ?? null,
      abdominal: e.abdominalCm ?? null,
    }))
  })()

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
            formatter={(v, name) => [`${v} cm`, String(name)]}
          />
          <Line type="monotone" dataKey="waist" stroke="#f59e0b" dot={{ r: 2, fill: '#f59e0b' }} strokeWidth={2} name="Taille" connectNulls />
          <Line type="monotone" dataKey="hip" stroke="#8b5cf6" dot={{ r: 2, fill: '#8b5cf6' }} strokeWidth={2} name="Hüfte" connectNulls />
          <Line type="monotone" dataKey="abdominal" stroke="#ef4444" dot={{ r: 2, fill: '#ef4444' }} strokeWidth={2} name="Bauch" connectNulls />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-yellow-400 rounded-full inline-block" />
          Taille
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-purple-500 rounded-full inline-block" />
          Hüfte
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-500 rounded-full inline-block" />
          Bauch
        </span>
      </div>
    </div>
  )
}
