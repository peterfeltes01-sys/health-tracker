import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts'
import { ArrowLeft, Pencil, Check } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/shared/Card'
import { Modal } from '../components/shared/Modal'
import { Input } from '../components/shared/Input'
import { Button } from '../components/shared/Button'
import { useStepsStore } from '../stores/stepsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { toISODate, getDatesInRange } from '../utils/calculations'
import { formatSteps } from '../utils/formatters'
import { subDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'

const RANGES = [
  { label: '7T', days: 7 },
  { label: '30T', days: 30 },
  { label: '90T', days: 90 },
] as const

export function StepsHistory() {
  const navigate = useNavigate()
  const today = toISODate(new Date())
  const [rangeDays, setRangeDays] = useState<number>(30)
  const [editDate, setEditDate] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')

  const { entries, loadByRange, setTotalForDate } = useStepsStore()
  const stepGoal = useSettingsStore((s) => s.settings.dailyStepGoal)

  useEffect(() => {
    const from = toISODate(subDays(new Date(), 90))
    loadByRange(from, today)
  }, [today])

  const totalsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      map[e.date] = (map[e.date] ?? 0) + e.steps
    }
    return map
  }, [entries])

  const chartData = useMemo(() => {
    const from = toISODate(subDays(new Date(), rangeDays - 1))
    return getDatesInRange(from, today).map((d) => ({
      date: d,
      label: format(parseISO(d), rangeDays > 14 ? 'd.M.' : 'EEE d.', { locale: de }),
      steps: totalsByDate[d] ?? 0,
      goal: stepGoal,
    }))
  }, [totalsByDate, stepGoal, rangeDays, today])

  const stats = useMemo(() => {
    const days = chartData
    const total = days.reduce((s, d) => s + d.steps, 0)
    const reached = days.filter((d) => d.steps >= stepGoal).length
    const avg = days.length > 0 ? Math.round(total / days.length) : 0
    return { total, reached, avg, dayCount: days.length }
  }, [chartData, stepGoal])

  const listData = useMemo(() => [...chartData].reverse(), [chartData])

  function openEdit(date: string) {
    setEditDate(date)
    setEditValue(String(totalsByDate[date] ?? ''))
    setEditError('')
  }

  async function submitEdit() {
    if (!editDate) return
    const n = parseInt(editValue, 10)
    if (!Number.isFinite(n) || n < 0) {
      setEditError('Bitte gültige Zahl eingeben')
      return
    }
    await setTotalForDate(n, editDate, 'manual')
    setEditDate(null)
  }

  return (
    <>
      <Header title="Schritte-Verlauf" />
      <PageWrapper>
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft size={16} /> Zurück
          </button>

          <Card>
            <div className="flex gap-1 mb-3">
              {RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRangeDays(r.days)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [formatSteps(v), 'Schritte']}
                  labelFormatter={(l) => `${l}`}
                />
                <ReferenceLine y={stepGoal} stroke="#10b981" strokeDasharray="4 4" />
                <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.date} fill={d.steps >= stepGoal ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatSteps(stats.avg)}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ø / Tag</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">{stats.reached}/{stats.dayCount}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ziele erreicht</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatSteps(stats.total)}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gesamt</p>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
              Tagesübersicht
            </h3>
            {listData.map((d) => {
              const pct = stepGoal > 0 ? Math.min(100, Math.round((d.steps / stepGoal) * 100)) : 0
              const reached = d.steps >= stepGoal
              const isToday = d.date === today
              return (
                <div
                  key={d.date}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(parseISO(d.date), 'EEEE, d. MMM', { locale: de })}
                        </p>
                        {isToday && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                            heute
                          </span>
                        )}
                        {reached && <Check size={14} className="text-green-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                          {formatSteps(d.steps)}
                        </span>
                        <span className="text-xs text-gray-400">
                          / {formatSteps(stepGoal)} ({pct}%)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(d.date)}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors flex-shrink-0"
                      aria-label="Bearbeiten"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all ${reached ? 'bg-green-500' : 'bg-primary-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </PageWrapper>

      <Modal
        open={editDate !== null}
        onClose={() => setEditDate(null)}
        title={editDate ? format(parseISO(editDate), 'EEEE, d. MMM', { locale: de }) : ''}
      >
        <div className="space-y-4">
          <Input
            label="Schritte für diesen Tag"
            type="number"
            inputMode="numeric"
            min="0"
            value={editValue}
            onChange={(e) => { setEditValue(e.target.value); setEditError('') }}
            error={editError}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setEditDate(null)}>Abbrechen</Button>
            <Button fullWidth onClick={submitEdit}>Speichern</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
