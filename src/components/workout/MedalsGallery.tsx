import { Medal } from 'lucide-react'
import type { Achievement, WorkoutStats, WeeklyGoal } from '../../types/workout'
import { getAllAchievementDefs } from '../../utils/workout/achievements'

const TIER_STYLES = {
  bronze: {
    earned: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    icon: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400',
    label: 'text-amber-700 dark:text-amber-400',
    badge: 'Bronze',
  },
  silber: {
    earned: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
    icon: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    label: 'text-gray-600 dark:text-gray-300',
    badge: 'Silber',
  },
  gold: {
    earned: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800',
    icon: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
    label: 'text-yellow-600 dark:text-yellow-400',
    badge: 'Gold',
  },
}

const CAT_LABELS = {
  streak: 'Streak',
  weekly: 'Wochensiege',
  points: 'Punkte',
  minutes: 'Minuten',
  special: 'Besondere',
}

interface MedalsGalleryProps {
  achievements: Achievement[]
  stats: WorkoutStats
  weeklyHistory: WeeklyGoal[]
}

function countConsecutiveWeeks(history: WeeklyGoal[]): number {
  const sorted = [...history].sort((a, b) => b.weekId.localeCompare(a.weekId))
  let count = 0
  for (const w of sorted) {
    if (w.achieved) count++
    else break
  }
  return count
}

export function MedalsGallery({ achievements, stats, weeklyHistory }: MedalsGalleryProps) {
  const earned = new Map(achievements.map((a) => [a.id, a]))
  const defs = getAllAchievementDefs()
  const consecutiveWeeks = countConsecutiveWeeks(weeklyHistory)

  const progressFor = (id: string): string => {
    if (id.startsWith('streak-')) {
      const target = parseInt(id.split('-')[1])
      return `${stats.currentStreakDays} / ${target} Tage`
    }
    if (id.startsWith('weekly-streak-')) {
      const target = parseInt(id.split('-')[2])
      return `${consecutiveWeeks} / ${target} Wochen`
    }
    if (id.startsWith('points-')) {
      const target = parseInt(id.split('-')[1])
      return `${stats.totalPoints.toLocaleString('de')} / ${target.toLocaleString('de')}`
    }
    if (id.startsWith('minutes-')) {
      const target = parseInt(id.split('-')[1])
      return `${stats.totalMinutes} / ${target} Min.`
    }
    return ''
  }

  const categories = ['streak', 'weekly', 'points', 'minutes', 'special'] as const

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catDefs = defs.filter((d) => d.category === cat)
        if (catDefs.length === 0) return null
        return (
          <div key={cat}>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">
              {CAT_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {catDefs.map((def) => {
                const a = earned.get(def.id)
                const isEarned = !!a
                const styles = TIER_STYLES[def.tier]
                return (
                  <div
                    key={def.id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                      isEarned
                        ? styles.earned
                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isEarned ? styles.icon : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                    }`}>
                      <Medal size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{def.title}</p>
                        <span className={`text-[10px] font-semibold flex-shrink-0 ${isEarned ? styles.label : 'text-gray-400'}`}>
                          {styles.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{def.description}</p>
                      {!isEarned && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{progressFor(def.id)}</p>
                      )}
                      {isEarned && a.earnedAt && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(a.earnedAt).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
