import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import type { BloodPressureEntry } from '../../types'
import { subDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  entries: BloodPressureEntry[]
}

const RANGES = [
  { label: '14T', days: 14 },
  { label: '30T', days: 30 },
  { label: '90T', days: 90 },
  { label: 'Alles', days: 0 },
]

export function BPTrendChart({ entries }: Props) {
  const [rangeDays, setRangeDays] = useState(30)

  const chartData = useMemo(() => {
    let data = entries
    if (rangeDays > 0) {
      const cutoff = subDays(new Date(), rangeDays)
      data = entries.filter((e) => parseISO(e.date) >= cutoff)
    }
    return data.map((e) => ({
      date: format(parseISO(e.date), 'd. MMM', { locale: de }),
      sys: e.systolic,
      dia: e.diastolic,
      pulse: e.pulse,
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

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          {/* ESH 2024 Referenzlinien */}
          <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} />
          <ReferenceLine y={90} stroke="#eab308" strokeDasharray="4 4" strokeWidth={1} />
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
            domain={[50, 200]}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(v: number, name: string) => [
              `${v} mmHg`,
              name === 'sys' ? 'Systolisch' : name === 'dia' ? 'Diastolisch' : 'Puls'
            ]}
          />
          <Line type="monotone" dataKey="sys" stroke="#ef4444" dot={{ r: 3 }} strokeWidth={2} name="sys" />
          <Line type="monotone" dataKey="dia" stroke="#3b82f6" dot={{ r: 3 }} strokeWidth={2} name="dia" />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-500 rounded-full inline-block" /> Systolisch
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-500 rounded-full inline-block" /> Diastolisch
        </span>
      </div>
    </div>
  )
}
