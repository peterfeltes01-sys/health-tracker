import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Activity } from '../../types'
import { ACTIVITIES, ACTIVITY_COLORS } from '../../utils/constants'
import { formatDuration } from '../../utils/formatters'
import { Card } from '../shared/Card'

interface ActivityPieChartProps {
  activities: Activity[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { name, value, fill } = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-3 text-xs border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: fill }} />
        <span className="font-semibold text-gray-700 dark:text-gray-300">{name}</span>
      </div>
      <div className="mt-1 text-gray-600 dark:text-gray-400">{formatDuration(value)}</div>
    </div>
  )
}

export function ActivityPieChart({ activities }: ActivityPieChartProps) {
  const data = ACTIVITIES
    .map((at) => {
      const total = activities
        .filter((a) => a.activityType === at.id)
        .reduce((s, a) => s + a.durationMinutes, 0)
      return { name: `${at.icon} ${at.label}`, value: total, fill: ACTIVITY_COLORS[at.id] ?? '#94a3b8', id: at.id }
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const totalMinutes = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-400 dark:text-gray-600">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm">Noch keine Aktivitäten</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🥧 Aktivitätsverteilung</h3>
      <div className="flex gap-4 items-center">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={data}
                cx={65}
                cy={65}
                innerRadius={42}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.map((d) => {
            const pct = Math.round((d.value / totalMinutes) * 100)
            return (
              <div key={d.id} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300 truncate">{d.name}</span>
                  <span className="text-gray-500 flex-shrink-0 ml-2 tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: d.fill }}
                  />
                </div>
              </div>
            )
          })}
          <div className="pt-1 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            Gesamt: {formatDuration(totalMinutes)}
          </div>
        </div>
      </div>
    </Card>
  )
}
