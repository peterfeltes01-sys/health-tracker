import { useState, useCallback, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { WorkoutDashboard } from '../components/workout/WorkoutDashboard'
import { SessionPlayer } from '../components/workout/SessionPlayer'
import { SessionSummary } from '../components/workout/SessionSummary'
import { ExerciseLibrary } from '../components/workout/ExerciseLibrary'
import { MedalsGallery } from '../components/workout/MedalsGallery'
import { ProgressView } from '../components/workout/ProgressView'
import { GoalSettings } from '../components/workout/GoalSettings'
import { RoutineList } from '../components/workout/RoutineList'
import { useWorkoutStore } from '../stores/workoutStore'
import { useRoutineStore } from '../stores/routineStore'
import { useAuth } from '../hooks/useAuth'
import { buildExercisesFromRoutine } from '../utils/workout/routineUtils'
import type { PerformedExercise, Achievement, WorkoutSession } from '../types/workout'
import type { Routine, RoutineExercise } from '../types/routine'

type WorkoutTab = 'heute' | 'routinen' | 'verlauf'
type WorkoutView =
  | 'tab'
  | 'session'
  | 'summary'
  | 'library'
  | 'medals'
  | 'progress'
  | 'settings'

const TAB_LABELS: Record<WorkoutTab, string> = {
  heute: 'Heute',
  routinen: 'Routinen',
  verlauf: 'Verlauf',
}

export function WorkoutPage() {
  const { user } = useAuth()
  const {
    load,
    loading,
    activeSession,
    stats,
    achievements,
    weeklyHistory,
    recentSessions,
    preferredMode,
    targetDays,
    targetPoints,
    startSession,
    finishSession,
    updateGoalSettings,
    buildBonusRound,
    customExercises,
  } = useWorkoutStore()

  const { loadRoutines } = useRoutineStore()

  const [tab, setTab] = useState<WorkoutTab>('heute')
  const [view, setView] = useState<WorkoutView>('tab')
  const [summaryData, setSummaryData] = useState<{
    session: WorkoutSession
    newAchievements: Achievement[]
  } | null>(null)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [activeRoutineExercises, setActiveRoutineExercises] = useState<RoutineExercise[] | undefined>(undefined)

  useEffect(() => {
    if (user?.uid) {
      load(user.uid)
      loadRoutines()
    }
  }, [user?.uid])

  const handleStartSession = useCallback(() => {
    setActiveRoutine(null)
    setActiveRoutineExercises(undefined)
    startSession()
    setView('session')
  }, [startSession])

  const handleStartRoutine = useCallback(
    (routine: Routine) => {
      const exercises = buildExercisesFromRoutine(routine, customExercises.map((ce) => ({
        id: ce.id,
        name: ce.name,
        modes: ce.modes,
        primaryMuscles: ce.primaryMuscles,
        secondaryMuscles: ce.secondaryMuscles,
        difficulty: ce.difficulty,
        target: ce.target,
        basePoints: ce.basePoints,
        mediaUrls: ce.media.map((m) => m.url),
        instructions: ce.instructions,
        chairVariantNote: ce.chairVariantNote,
      })))
      if (exercises.length === 0) return
      setActiveRoutine(routine)
      setActiveRoutineExercises(routine.exercises)
      useWorkoutStore.setState({
        activeSession: {
          mode: preferredMode,
          exercises,
          currentIndex: 0,
          startedAt: Date.now(),
          performed: [],
        },
      })
      setView('session')
    },
    [customExercises, preferredMode]
  )

  const handleStartBonusSession = useCallback(() => {
    setActiveRoutine(null)
    setActiveRoutineExercises(undefined)
    buildBonusRound()
    startSession()
    setView('session')
  }, [buildBonusRound, startSession])

  const handleSessionFinish = useCallback(
    async (performed: PerformedExercise[]) => {
      const store = useWorkoutStore.getState()
      if (store.activeSession) {
        useWorkoutStore.setState({
          activeSession: { ...store.activeSession, performed },
        })
      }
      const { newAchievements } = await finishSession()
      const completedSession = useWorkoutStore.getState().todaySession
      if (completedSession) {
        setSummaryData({ session: completedSession, newAchievements })
        setView('summary')
      } else {
        setView('tab')
      }
    },
    [finishSession]
  )

  const handleSessionAbort = useCallback(() => {
    setActiveRoutine(null)
    setActiveRoutineExercises(undefined)
    setView('tab')
  }, [])

  const handleSummaryDone = useCallback(() => {
    setSummaryData(null)
    setActiveRoutine(null)
    setActiveRoutineExercises(undefined)
    setView('tab')
  }, [])

  const handleSaveGoals = useCallback(
    (days: number, pts: number, mode: typeof preferredMode) => {
      updateGoalSettings(days, pts, mode)
    },
    [updateGoalSettings]
  )

  if (view === 'session' && activeSession) {
    return (
      <SessionPlayer
        exercises={activeSession.exercises}
        routineExercises={activeRoutine ? activeRoutineExercises : undefined}
        onFinish={handleSessionFinish}
        onAbort={handleSessionAbort}
      />
    )
  }

  if (view === 'summary' && summaryData) {
    return (
      <SessionSummary
        session={summaryData.session}
        newAchievements={summaryData.newAchievements}
        onDone={handleSummaryDone}
      />
    )
  }

  const subViewTitle: Record<WorkoutView, string> = {
    tab: 'Training',
    session: '',
    summary: '',
    library: 'Übungsbibliothek',
    medals: 'Auszeichnungen',
    progress: 'Fortschritt',
    settings: 'Trainingsziele',
  }

  const showBack = view !== 'tab'

  return (
    <>
      <Header title={view === 'tab' ? 'Training' : subViewTitle[view]} />
      {showBack && (
        <div className="sticky top-[57px] z-30 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setView('tab')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            <ArrowLeft size={16} />
            Zurück
          </button>
        </div>
      )}

      <PageWrapper>
        {loading && view === 'tab' ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {view === 'tab' && (
              <>
                {/* Tab bar */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-2xl p-1 mb-4">
                  {(['heute', 'routinen', 'verlauf'] as WorkoutTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                        tab === t
                          ? 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {TAB_LABELS[t]}
                    </button>
                  ))}
                </div>

                {tab === 'heute' && (
                  <WorkoutDashboard
                    onNavigate={(v) => setView(v as WorkoutView)}
                    onStartSession={handleStartSession}
                    onStartBonusSession={handleStartBonusSession}
                    onStartRoutine={handleStartRoutine}
                  />
                )}
                {tab === 'routinen' && (
                  <RoutineList onStartRoutine={handleStartRoutine} />
                )}
                {tab === 'verlauf' && (
                  <ProgressView sessions={recentSessions} />
                )}
              </>
            )}
            {view === 'library' && <ExerciseLibrary onBack={() => setView('tab')} />}
            {view === 'medals' && (
              <MedalsGallery
                achievements={achievements}
                stats={stats}
                weeklyHistory={weeklyHistory}
              />
            )}
            {view === 'progress' && <ProgressView sessions={recentSessions} />}
            {view === 'settings' && (
              <GoalSettings
                preferredMode={preferredMode}
                targetDays={targetDays}
                targetPoints={targetPoints}
                onSave={handleSaveGoals}
              />
            )}
          </>
        )}
      </PageWrapper>
    </>
  )
}
