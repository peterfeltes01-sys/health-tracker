import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, Info, CheckCircle2, Circle } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useWorkoutStore } from '../stores/workoutStore'
import { TRAINING_MUSCLE_LABELS, BUCKET_LABELS } from '../types/training'
import type { BalanceWarning } from '../features/workout/logic/balance'

const RECOVERY_COLORS = {
  fresh: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Frisch' },
  recovering: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', label: 'Erholt sich' },
  recently_trained: { bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', label: 'Trainiert' },
}

function WarningIcon({ type, severity }: Pick<BalanceWarning, 'type' | 'severity'>) {
  if (type === 'push_pull_imbalance' || severity === 'warn') {
    return <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
  }
  return <Info size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
}

export function BalancePage() {
  const { selectWeeklyVolume, selectBalanceWarnings, selectRecovery, recentSessions } =
    useWorkoutStore()

  const { byMuscle, byBucket } = useMemo(
    () => selectWeeklyVolume(),
    [recentSessions]
  )
  const warnings = useMemo(() => selectBalanceWarnings(), [recentSessions])
  const recovery = useMemo(() => selectRecovery(), [recentSessions])

  const hasData = byMuscle.length > 0 || byBucket.length > 0

  const muscleChartData = byMuscle.map((m) => ({
    name: TRAINING_MUSCLE_LABELS[m.muscle],
    sets: Math.round(m.sets * 10) / 10,
  }))

  const bucketChartData = byBucket.map((b) => ({
    name: BUCKET_LABELS[b.bucket],
    sets: Math.round(b.sets * 10) / 10,
  }))

  const freshMuscles = recovery.filter((r) => r.state === 'fresh').map((r) => TRAINING_MUSCLE_LABELS[r.muscle])

  return (
    <>
      <Header title="Balance & Recovery" />
      <PageWrapper>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Noch keine Trainingsdaten der letzten 7 Tage. Starte eine Session, um deine Balance zu sehen.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Fresh today */}
            {freshMuscles.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Heute frisch: {freshMuscles.join(', ')}
                </p>
              </div>
            )}

            {/* Recovery status */}
            {recovery.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2.5">Recovery</h2>
                <div className="grid grid-cols-2 gap-2">
                  {recovery.map((r) => {
                    const colors = RECOVERY_COLORS[r.state]
                    return (
                      <div
                        key={r.muscle}
                        className={`${colors.bg} rounded-2xl px-3 py-2.5 flex items-center gap-2`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${colors.text}`}>
                            {TRAINING_MUSCLE_LABELS[r.muscle]}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{colors.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Weekly volume per muscle */}
            {muscleChartData.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2.5">
                  Wochenvolumen je Muskel
                </h2>
                <p className="text-[10px] text-gray-400 mb-2">Richtwert: 10–20 Sätze/Woche</p>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                  <ResponsiveContainer width="100%" height={Math.max(160, muscleChartData.length * 26)}>
                    <BarChart
                      data={muscleChartData}
                      layout="vertical"
                      margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 'dataMax']}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}
                        formatter={(v) => [`${v} Sätze`, '']}
                      />
                      {/* Reference band 10–20 */}
                      <ReferenceLine x={10} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} />
                      <ReferenceLine x={20} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                      <Bar dataKey="sets" radius={[0, 4, 4, 0]}>
                        {muscleChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.sets < 10
                                ? '#94a3b8'
                                : entry.sets > 20
                                ? '#f87171'
                                : '#6366f1'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-3 mt-1 justify-end">
                    <span className="flex items-center gap-1 text-[9px] text-gray-400">
                      <span className="w-4 h-px border-t-2 border-dashed border-green-500 inline-block" />min
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-gray-400">
                      <span className="w-4 h-px border-t-2 border-dashed border-red-400 inline-block" />max
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Push / Pull / Legs / Core */}
            {bucketChartData.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2.5">
                  Drücken / Ziehen / Beine / Core
                </h2>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={bucketChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 9 }}
                        width={24}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99,102,241,.08)' }}
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}
                        formatter={(v) => [`${v} Sätze`, '']}
                      />
                      <Bar dataKey="sets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Balance warnings */}
            {warnings.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2.5">Hinweise</h2>
                <div className="space-y-2">
                  {warnings.map((w, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl px-4 py-3 flex items-start gap-2.5 ${
                        w.severity === 'warn'
                          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40'
                          : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40'
                      }`}
                    >
                      <WarningIcon type={w.type} severity={w.severity} />
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        {w.message}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {warnings.length === 0 && hasData && (
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl px-4 py-3">
                <Circle size={14} className="text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  Deine Balance sieht diese Woche gut aus!
                </p>
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </>
  )
}
