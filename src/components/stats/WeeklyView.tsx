import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import type { StepEntry, Activity, HydrationEntry } from '../../types'
import { ACTIVITIES, ACTIVITY_COLORS, HYDRATION_COLORS, DRINK_TYPES } from '../../utils/constants'
import { getDatesInRange } from '../../utils/calculations'
import { formatWeekday } from '../../utils/formatters'
import { Card } from '../shared/Card'

interface WeeklyViewProps {
  from: string
  to: string
  steps: StepEntry[]
  activities: Activity[]
  hydration: HydrationEntry[]
  stepGoal: number
  hydrationGoal: number
}

const DRINK_KEYS = DRINK_TYPES.map((d) => d.id)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const entries = payload.filter((p: any) => p.value > 0)
  if (!entries.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-3 text-xs border border-gray-100 dark:border-gray-700 max-w-[180px]">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>
      {entries.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 items-center">
          <span style={{ color: p.fill }} className="font-medium truncate">{p.name}</span>
          <span className="text-gray-600 dark:text-gray-400 tabular-nums flex-shrink-0">{p.value.toLocaleString('de-DE')}</span>
        </div>
      ))}
    </div>
  )
}

export function WeeklyView({ from, to, steps, activities, hydration, stepGoal, hydrationGoal }: WeeklyViewProps) {
  const dates = getDatesInRange(from, to)

  const activityTypes = ACTIVITIES.filter((a) => a.id !== 'other')

  const stepData = dates.map((date) => {
    const total = steps.filter((s) => s.date === date).reduce((a, b) => a + b.steps, 0)
    return { label: formatWeekday(date), date, steps: total }
  })

  const actData = dates.map((date) => {
    const dayActs = activities.filter((a) => a.date === date)
    const row: Record<string, string | number> = { label: formatWeekday(date), date }
    activityTypes.forEach((at) => {
      row[at.id] = dayActs.filter((a) => a.activityType === at.id).reduce((s, a) => s + a.durationMinutes, 0)
    })
    row['other'] = dayActs.filter((a) => !activityTypes.find((t) => t.id === a.activityType)).reduce((s, a) => s + a.durationMinutes, 0)
    return row
  })

  const calData = dates.map((date) => {
    const dayActs = activities.filter((a) => a.date === date)
    const row: Record<string, string | number> = { label: formatWeekday(date), date }
    activityTypes.forEach((at) => {
      row[at.id] = Math.round(dayActs.filter((a) => a.activityType === at.id).reduce((s, a) => s + (a.calories ?? 0), 0))
    })
    row['other'] = Math.round(dayActs.filter((a) => !activityTypes.find((t) => t.id === a.activityType)).reduce((s, a) => s + (a.calories ?? 0), 0))
    return row
  })

  const hydData = dates.map((date) => {
    const row: Record<string, string | number> = { label: formatWeekday(date), date }
    DRINK_KEYS.forEach((dk) => {
      row[dk] = hydration.filter((h) => h.date === date && h.drinkType === dk).reduce((s, h) => s + h.amountMl, 0)
    })
    return row
  })

  const allActivityTypes = [...activityTypes, { id: 'other', label: 'Sonstiges', icon: '⚡' }]
  const usedActTypes = allActivityTypes.filter((at) => actData.some((d) => (d[at.id] as number) > 0))
  const usedDrinkTypes = DRINK_TYPES.filter((dt) => hydData.some((d) => (d[dt.id] as number) > 0))

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🦶 Schritte / Tag</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={stepData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stepGoal} stroke="#26a469" strokeDasharray="4 4" />
            <Bar dataKey="steps" name="Schritte" radius={[6, 6, 0, 0]}>
              {stepData.map((d) => (
                <Cell key={d.date} fill={d.steps >= stepGoal ? '#26a469' : '#86efac'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🏃 Aktivitätsdauer / Tag (min)</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={actData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {usedActTypes.map((at) => (
              <Bar
                key={at.id}
                dataKey={at.id}
                name={`${ACTIVITIES.find(a => a.id === at.id)?.icon ?? '⚡'} ${at.label}`}
                stackId="acts"
                fill={ACTIVITY_COLORS[at.id] ?? '#94a3b8'}
                radius={usedActTypes[usedActTypes.length - 1].id === at.id ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        {usedActTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {usedActTypes.map((at) => (
              <div key={at.id} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: ACTIVITY_COLORS[at.id] ?? '#94a3b8' }} />
                {ACTIVITIES.find(a => a.id === at.id)?.icon ?? '⚡'} {at.label}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🔥 Kalorien / Tag (kcal)</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={calData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {usedActTypes.map((at) => (
              <Bar
                key={at.id}
                dataKey={at.id}
                name={`${ACTIVITIES.find(a => a.id === at.id)?.icon ?? '⚡'} ${at.label}`}
                stackId="cals"
                fill={ACTIVITY_COLORS[at.id] ?? '#94a3b8'}
                radius={usedActTypes[usedActTypes.length - 1].id === at.id ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        {usedActTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {usedActTypes.map((at) => (
              <div key={at.id} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: ACTIVITY_COLORS[at.id] ?? '#94a3b8' }} />
                {ACTIVITIES.find(a => a.id === at.id)?.icon ?? '⚡'} {at.label}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">💧 Flüssigkeit / Tag (ml)</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={hydData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}L`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={hydrationGoal} stroke="#3b82f6" strokeDasharray="4 4" />
            {usedDrinkTypes.map((dt, i) => (
              <Bar
                key={dt.id}
                dataKey={dt.id}
                name={`${dt.icon} ${dt.label}`}
                stackId="hyd"
                fill={HYDRATION_COLORS[dt.id]}
                radius={i === usedDrinkTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        {usedDrinkTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {usedDrinkTypes.map((dt) => (
              <div key={dt.id} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: HYDRATION_COLORS[dt.id] }} />
                {dt.icon} {dt.label}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
