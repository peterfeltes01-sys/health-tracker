import type { Achievement, WorkoutStats, WeeklyGoal, MedalTier } from '../../types/workout'

interface AchievementDef {
  id: string
  category: Achievement['category']
  tier: MedalTier
  title: string
  description: string
  check: (stats: WorkoutStats, weeklyHistory: WeeklyGoal[]) => boolean
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Streak
  {
    id: 'streak-7',
    category: 'streak',
    tier: 'bronze',
    title: '7-Tage-Streak',
    description: '7 Tage in Folge trainiert',
    check: (s) => s.currentStreakDays >= 7,
  },
  {
    id: 'streak-30',
    category: 'streak',
    tier: 'silber',
    title: '30-Tage-Streak',
    description: '30 Tage in Folge trainiert',
    check: (s) => s.currentStreakDays >= 30,
  },
  {
    id: 'streak-100',
    category: 'streak',
    tier: 'gold',
    title: '100-Tage-Streak',
    description: '100 Tage in Folge trainiert',
    check: (s) => s.currentStreakDays >= 100,
  },
  // Weekly series
  {
    id: 'weekly-streak-4',
    category: 'weekly',
    tier: 'bronze',
    title: '4 Wochen in Folge',
    description: '4 Wochen das Wochenziel erreicht',
    check: (_, h) => countConsecutiveAchievedWeeks(h) >= 4,
  },
  {
    id: 'weekly-streak-12',
    category: 'weekly',
    tier: 'silber',
    title: '12 Wochen in Folge',
    description: '12 Wochen das Wochenziel erreicht',
    check: (_, h) => countConsecutiveAchievedWeeks(h) >= 12,
  },
  {
    id: 'weekly-streak-52',
    category: 'weekly',
    tier: 'gold',
    title: '52 Wochen in Folge',
    description: '52 Wochen das Wochenziel erreicht',
    check: (_, h) => countConsecutiveAchievedWeeks(h) >= 52,
  },
  // Total points
  {
    id: 'points-500',
    category: 'points',
    tier: 'bronze',
    title: '500 Punkte',
    description: '500 Gesamtpunkte gesammelt',
    check: (s) => s.totalPoints >= 500,
  },
  {
    id: 'points-2000',
    category: 'points',
    tier: 'silber',
    title: '2.000 Punkte',
    description: '2.000 Gesamtpunkte gesammelt',
    check: (s) => s.totalPoints >= 2000,
  },
  {
    id: 'points-10000',
    category: 'points',
    tier: 'gold',
    title: '10.000 Punkte',
    description: '10.000 Gesamtpunkte gesammelt',
    check: (s) => s.totalPoints >= 10000,
  },
  // Minutes
  {
    id: 'minutes-60',
    category: 'minutes',
    tier: 'bronze',
    title: '60 Minuten',
    description: '60 Gesamtminuten trainiert',
    check: (s) => s.totalMinutes >= 60,
  },
  {
    id: 'minutes-300',
    category: 'minutes',
    tier: 'silber',
    title: '300 Minuten',
    description: '300 Gesamtminuten trainiert',
    check: (s) => s.totalMinutes >= 300,
  },
  {
    id: 'minutes-1000',
    category: 'minutes',
    tier: 'gold',
    title: '1.000 Minuten',
    description: '1.000 Gesamtminuten trainiert',
    check: (s) => s.totalMinutes >= 1000,
  },
  // Special
  {
    id: 'first-session',
    category: 'special',
    tier: 'bronze',
    title: 'Erste Einheit',
    description: 'Die erste Trainingseinheit abgeschlossen',
    check: (s) => s.totalSessions >= 1,
  },
]

function countConsecutiveAchievedWeeks(history: WeeklyGoal[]): number {
  const sorted = [...history].sort((a, b) => b.weekId.localeCompare(a.weekId))
  let count = 0
  for (const w of sorted) {
    if (w.achieved) count++
    else break
  }
  return count
}

export function evaluateAchievements(
  stats: WorkoutStats,
  weeklyHistory: WeeklyGoal[],
  alreadyEarned: Set<string>
): Achievement[] {
  const newAchievements: Achievement[] = []
  for (const def of ACHIEVEMENT_DEFS) {
    if (alreadyEarned.has(def.id)) continue
    if (def.check(stats, weeklyHistory)) {
      newAchievements.push({
        id: def.id,
        category: def.category,
        tier: def.tier,
        title: def.title,
        description: def.description,
        earnedAt: Date.now(),
      })
    }
  }
  return newAchievements
}

export function getAllAchievementDefs() {
  return ACHIEVEMENT_DEFS
}
