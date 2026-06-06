import { Library, Medal, BarChart2, Settings } from 'lucide-react'
import type { ExerciseMode } from '../../types/workout'
import type { Routine } from '../../types/routine'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useRoutineStore } from '../../stores/routineStore'
import { TodayRoutineCard } from './TodayRoutineCard'
import { PointBalanceCard } from './PointBalanceCard'
import { WeeklyGoalCard } from './WeeklyGoalCard'
import { QuickStatsRow } from './QuickStatsRow'
import { RoutineCard } from './RoutineCard'
import { sessionTargetPoints } from '../../utils/workout/scoring'
import { getDueRoutines } from '../../utils/workout/routineUtils'
import { toISODate } from '../../utils/calculations'

interface WorkoutDashboardProps {
  onNavigate: (view: string) => void
  onStartSession: () => void
  onStartBonusSession: () => void
  onStartRoutine: (routine: Routine) => void
}

export function WorkoutDashboard({ onNavigate, onStartSession, onStartBonusSession, onStartRoutine }: WorkoutDashboardProps) {
  const {
    todayRoutine,
    todaySession,
    recentSessions,
    stats,
    currentWeekGoal,
    preferredMode,
    buildRoutine,
    applyBalanceToday,
  } = useWorkoutStore()

  const { routines, updateRoutine, removeRoutine } = useRoutineStore()

  const today = toISODate(new Date())
  const sessionsToday = recentSessions.filter((s) => s.date === today).length

  const dailyTarget = sessionTargetPoints(todayRoutine)
  const belowTarget = todaySession ? todaySession.totalPoints < dailyTarget : false
  const canApplyBalance = belowTarget && stats.pointBalance > 0

  const dueRoutines = getDueRoutines(routines, new Date())

  const quickLinks = [
    { icon: Library, label: 'Übungen', view: 'library' },
    { icon: Medal, label: 'Medaillen', view: 'medals' },
    { icon: BarChart2, label: 'Fortschritt', view: 'progress' },
    { icon: Settings, label: 'Ziele', view: 'settings' },
  ]

  return (
    <div className="space-y-4">
      {/* Due routines */}
      {dueRoutines.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-primary-500 uppercase tracking-wide">Heute fällig</p>
          {dueRoutines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              isDue
              onStart={() => onStartRoutine(r)}
              onEdit={() => onNavigate('tab')}
              onDelete={() => removeRoutine(r.id)}
              onToggleActive={() => updateRoutine(r.id, { isActive: !r.isActive })}
            />
          ))}
        </div>
      )}

      <TodayRoutineCard
        exercises={todayRoutine}
        mode={preferredMode}
        sessionsToday={sessionsToday}
        onStart={onStartSession}
        onBonusStart={onStartBonusSession}
        onModeChange={(m: ExerciseMode) => buildRoutine(m)}
        onRebuild={() => buildRoutine()}
      />

      <PointBalanceCard
        totalPoints={stats.totalPoints}
        pointBalance={stats.pointBalance}
        canApplyBalance={canApplyBalance}
        onApplyBalance={applyBalanceToday}
      />

      {currentWeekGoal && <WeeklyGoalCard goal={currentWeekGoal} />}

      <QuickStatsRow stats={stats} />

      <div className="grid grid-cols-4 gap-2">
        {quickLinks.map(({ icon: Icon, label, view }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-900 rounded-2xl py-3 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
          >
            <Icon size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
