import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays } from 'date-fns'
import { de } from 'date-fns/locale'
import type { WorkoutSession } from '../../types/workout'
import { toISODate } from '../../utils/calculations'

interface ProgressViewProps {
  sessions: WorkoutSession[]
}

export function ProgressView({ sessions }: ProgressViewProps) {
  // Last 14 days - points per day
  const today = new Date()
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(today, 13 - i)
    const dateStr = toISODate(d)
    const session = sessions.find((s) => s.date === dateStr)
    return {
      label: format(d, 'dd.MM', { locale: de }),
      date: dateStr,
      points: session?.totalPoints ?? 0,
      minutes: session ? Math.round(session.durationSeconds / 60) : 0,
    }
  })

  // Weekly minutes
  const weeklySessions = sessions.filter((s) => {
    const d = new Date(s.date)
    return d >= subDays(today, 28)
  })

  const weeklyData: { week: string; minutes: number; sessions: number }[] = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = subDays(today, w * 7 + 6)
    const weekEnd = subDays(today, w * 7)
    const startStr = toISODate(weekStart)
    const endStr = toISODate(weekEnd)
    const wSessions = weeklySessions.filter((s) => s.date >= startStr && s.date <= endStr)
    weeklyData.push({
      week: format(weekStart, 'dd.MM', { locale: de }),
      minutes: wSessions.reduce((sum, s) => sum + Math.round(s.durationSeconds / 60), 0),
      sessions: wSessions.length,
    })
  }

  const totalPoints14 = last14.reduce((s, d) => s + d.points, 0)
  const trainingDays14 = last14.filter((d) => d.points > 0).length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
          <div className="text-2xl font-black text-primary-500">{totalPoints14}</div>
          <div className="text-xs text-gray-400 mt-0.5">Punkte (14 Tage)</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
          <div className="text-2xl font-black text-emerald-500">{trainingDays14}</div>
          <div className="text-xs text-gray-400 mt-0.5">Trainingstage (14 Tage)</div>
        </div>
      </div>

      {/* Points per day */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Punkte pro Tag</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={last14} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="pointsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg, #1f2937)',
                border: 'none',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v) => [`${v} P`, 'Punkte']}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#pointsGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly minutes */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Minuten pro Woche</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 12, fontSize: 12 }}
              formatter={(v) => [`${v} min`, 'Minuten']}
            />
            <Bar dataKey="minutes" fill="#06b6d4" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Letzte Einheiten</h3>
          <div className="space-y-2">
            {[...sessions].reverse().slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.date}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.mode} · {Math.round(s.durationSeconds / 60)} Min.</p>
                </div>
                <div className="text-sm font-bold text-primary-500">+{s.totalPoints} P</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
