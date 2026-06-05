import { useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Edit2, Archive, ArchiveRestore } from 'lucide-react'
import { subDays } from 'date-fns'
import { PageWrapper } from '../components/layout/PageWrapper'
import { HabitDetailStats } from '../components/habits/HabitDetailStats'
import { HabitHeatmap } from '../components/habits/HabitHeatmap'
import { HabitTrendChart } from '../components/habits/HabitTrendChart'
import { useHabitStore } from '../stores/habitStore'
import { toISODate } from '../utils/calculations'

export function HabitDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const today = toISODate(new Date())

  const { habits, entries, loadEntries, archiveHabit, unarchiveHabit } = useHabitStore()
  const habit = habits.find((h) => h.id === id)

  const loadDetail = useCallback(async () => {
    // Load a full year of entries for heatmap + stats
    const from = toISODate(subDays(new Date(), 364))
    await loadEntries(from, today)
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [id])

  if (!habit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Gewohnheit nicht gefunden</p>
          <button
            onClick={() => navigate('/habits')}
            className="text-sm font-medium text-violet-500"
          >
            Zurück
          </button>
        </div>
      </div>
    )
  }

  const habitEntries = entries.filter((e) => e.habitId === habit.id)
  const isArchived = !!habit.archivedAt

  return (
    <>
      {/* Custom header with back button */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/habits')}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={22} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
            <span className="text-xl">{habit.icon}</span>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {habit.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/habits/${habit.id}/edit`)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Edit2 size={18} className="text-gray-500" />
            </button>
            <button
              onClick={async () => {
                if (isArchived) {
                  await unarchiveHabit(habit.id)
                } else {
                  await archiveHabit(habit.id)
                  navigate('/habits')
                }
              }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isArchived ? (
                <ArchiveRestore size={18} className="text-emerald-500" />
              ) : (
                <Archive size={18} className="text-amber-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      <PageWrapper>
        <div className="space-y-4">
          {/* Habit color banner */}
          <div
            className="rounded-2xl p-4 text-white"
            style={{ backgroundColor: habit.color }}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{habit.icon}</span>
              <div>
                <p className="text-lg font-bold">{habit.name}</p>
                {habit.category && (
                  <p className="text-sm opacity-80">{habit.category}</p>
                )}
                <p className="text-xs opacity-70 mt-0.5">
                  {habit.type === 'binary' ? 'Ja/Nein' : `Ziel: ${habit.targetValue} ${habit.targetUnit ?? ''}`}
                  {' · '}
                  {habit.frequency === 'daily'
                    ? 'Täglich'
                    : habit.frequency === 'weekdays'
                    ? 'Wochentage'
                    : habit.frequency === 'timesPerWeek'
                    ? `${habit.targetCount}×/Woche`
                    : `${habit.targetCount}×/Monat`}
                </p>
              </div>
            </div>
            {isArchived && (
              <p className="text-xs mt-2 opacity-80 font-medium">📦 Archiviert</p>
            )}
          </div>

          {/* Stats */}
          <HabitDetailStats habit={habit} entries={habitEntries} today={today} />

          {/* Heatmap */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
              Jahresübersicht
            </p>
            <HabitHeatmap habit={habit} entries={habitEntries} today={today} />
          </div>

          {/* Trend chart */}
          <HabitTrendChart habit={habit} entries={habitEntries} today={today} />

          {/* Recent entries */}
          {habitEntries.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Letzte Einträge
              </p>
              <div className="space-y-2">
                {[...habitEntries]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 7)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                          entry.completed ? '' : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                        style={entry.completed ? { backgroundColor: habit.color } : undefined}
                      >
                        {entry.completed && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.date}
                          {entry.value !== null && (
                            <span className="ml-2 font-medium tabular-nums">
                              {entry.value} {habit.targetUnit}
                            </span>
                          )}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-gray-400 truncate">{entry.note}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          entry.completed ? '' : 'text-gray-400'
                        }`}
                        style={entry.completed ? { color: habit.color } : undefined}
                      >
                        {entry.completed ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
