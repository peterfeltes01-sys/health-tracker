import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArrowUp,
  ArrowDown,
  ArchiveRestore,
  Edit2,
} from 'lucide-react'
import { subDays } from 'date-fns'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { HabitCard } from '../components/habits/HabitCard'
import { useHabitStore } from '../stores/habitStore'
import { isDueOnDate } from '../lib/habitStats'
import { toISODate } from '../utils/calculations'
import { useHabitReminders } from '../hooks/useHabitReminders'

type Tab = 'today' | 'all' | 'archive'

export function HabitsPage() {
  const today = toISODate(new Date())
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('today')
  const [selectedDate, setSelectedDate] = useState(today)

  const {
    habits,
    entries,
    loading,
    load,
    loadEntries,
    archiveHabit,
    unarchiveHabit,
    moveHabitUp,
    moveHabitDown,
  } = useHabitStore()

  const loadData = useCallback(async () => {
    await load()
    const from = toISODate(subDays(new Date(), 7))
    await loadEntries(from, today)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  // Load entries for selected date range (for backfill)
  useEffect(() => {
    const from = selectedDate < today ? selectedDate : toISODate(subDays(new Date(), 7))
    loadEntries(from, today)
  }, [selectedDate])

  useHabitReminders(habits)

  const activeHabits = habits
    .filter((h) => !h.archivedAt)
    .sort((a, b) => a.order - b.order)
  const archivedHabits = habits.filter((h) => !!h.archivedAt)
  const dueToday = activeHabits.filter((h) => isDueOnDate(h, selectedDate))

  function stepDate(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const next = toISODate(d)
    if (next <= today) setSelectedDate(next)
  }

  const isToday = selectedDate === today
  const dateLabel = isToday
    ? 'Heute'
    : selectedDate === toISODate(subDays(new Date(), 1))
    ? 'Gestern'
    : selectedDate

  const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: 'today', label: 'Heute' },
    { key: 'all', label: 'Alle' },
    { key: 'archive', label: 'Archiv' },
  ]

  return (
    <>
      <Header title="Gewohnheiten" />
      <PageWrapper>
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {TAB_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tab === key
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {label}
                {key === 'archive' && archivedHabits.length > 0 && (
                  <span className="ml-1 text-xs text-gray-400">({archivedHabits.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Today tab: date navigation + habit list */}
          {tab === 'today' && (
            <>
              {/* Date navigation */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-2.5">
                <button
                  onClick={() => stepDate(-1)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{dateLabel}</p>
                <button
                  onClick={() => stepDate(1)}
                  disabled={isToday}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={18} className="text-gray-500" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Laden…</div>
              ) : dueToday.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🎯</p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Keine Gewohnheiten für diesen Tag
                  </p>
                  <button
                    onClick={() => navigate('/habits/new')}
                    className="mt-4 text-sm font-semibold text-violet-500"
                  >
                    Erste Gewohnheit anlegen →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dueToday.map((habit) => {
                    const entry =
                      entries.find((e) => e.habitId === habit.id && e.date === selectedDate) ?? null
                    return (
                      <HabitCard key={habit.id} habit={habit} entry={entry} date={selectedDate} />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* All tab: manage & reorder */}
          {tab === 'all' && (
            <>
              {activeHabits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🎯</p>
                  <p className="text-sm text-gray-400">Noch keine Gewohnheiten</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeHabits.map((habit, idx) => (
                    <div
                      key={habit.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3 px-3 py-3"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: habit.color + '20' }}
                      >
                        {habit.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {habit.name}
                        </p>
                        {habit.category && (
                          <p className="text-xs text-gray-400 truncate">{habit.category}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => moveHabitUp(habit.id)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => moveHabitDown(habit.id)}
                          disabled={idx === activeHabits.length - 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition-colors"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/habits/${habit.id}/edit`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => archiveHabit(habit.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Archive tab */}
          {tab === 'archive' && (
            <>
              {archivedHabits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="text-sm text-gray-400">Kein archivierter Eintrag</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archivedHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3 px-3 py-3 opacity-60"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: habit.color + '20' }}
                      >
                        {habit.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate line-through">
                          {habit.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Archiviert {habit.archivedAt ? habit.archivedAt.slice(0, 10) : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => unarchiveHabit(habit.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title="Wiederherstellen"
                      >
                        <ArchiveRestore size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PageWrapper>

      {/* FAB */}
      <button
        onClick={() => navigate('/habits/new')}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </>
  )
}
