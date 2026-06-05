import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { subDays, format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Habit, HabitEntry } from '../../types/habits'
import { toISODate } from '../../utils/calculations'
import { isEntryFulfilled } from '../../lib/habitStats'

interface HabitTrendChartProps {
  habit: Habit
  entries: HabitEntry[]
  today: string
}

export function HabitTrendChart({ habit, entries, today }: HabitTrendChartProps) {
  const entryMap = new Map(entries.map((e) => [e.date, e]))

  if (habit.type === 'binary') {
    // Weekly completion % — last 12 weeks
    const data = Array.from({ length: 12 }, (_, i) => {
      const weekEndDate = subDays(new Date(today + 'T12:00:00'), (11 - i) * 7)
      const days = Array.from({ length: 7 }, (_, d) =>
        toISODate(subDays(weekEndDate, 6 - d))
      ).filter((d) => d <= today)
      const done = days.filter((d) => {
        const e = entryMap.get(d)
        return e && isEntryFulfilled(e, habit)
      }).length
      const pct = days.length === 0 ? 0 : Math.round((done / days.length) * 100)
      return {
        week: format(weekEndDate, 'dd.MM', { locale: de }),
        pct,
      }
    })

    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
          Wöchentliche Erfüllung
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: unknown) => [`${Number(v)}%`, 'Erfüllt'] as [string, string]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="pct" fill={habit.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Quantified: daily line chart — last 30 days
  const data = Array.from({ length: 30 }, (_, i) => {
    const date = toISODate(subDays(new Date(today + 'T12:00:00'), 29 - i))
    const entry = entryMap.get(date)
    return {
      date: format(new Date(date + 'T12:00:00'), 'dd.MM', { locale: de }),
      value: entry?.value ?? null,
    }
  })

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
        Verlauf (30 Tage){habit.targetUnit ? ` · ${habit.targetUnit}` : ''}
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: unknown) => {
              const val = v as number | null
              return [val !== null && val !== undefined ? `${val}${habit.targetUnit ? ' ' + habit.targetUnit : ''}` : '—', 'Wert'] as [string, string]
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          {habit.targetValue !== null && (
            <ReferenceLine
              y={habit.targetValue}
              stroke={habit.color}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{ value: 'Ziel', position: 'right', fontSize: 9, fill: habit.color }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={habit.color}
            strokeWidth={2}
            dot={{ r: 2, fill: habit.color }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
