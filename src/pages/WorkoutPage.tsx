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
import { useWorkoutStore } from '../stores/workoutStore'
import { useAuth } from '../hooks/useAuth'
import type { PerformedExercise, Achievement, WorkoutSession } from '../types/workout'

type WorkoutView = 'dashboard' | 'session' | 'summary' | 'library' | 'medals' | 'progress' | 'settings'

const VIEW_TITLES: Record<WorkoutView, string> = {
  dashboard: 'Training',
  session: '',
  summary: '',
  library: 'Übungsbibliothek',
  medals: 'Auszeichnungen',
  progress: 'Fortschritt',
  settings: 'Trainingsziele',
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
  } = useWorkoutStore()

  const [view, setView] = useState<WorkoutView>('dashboard')
  const [summaryData, setSummaryData] = useState<{
    session: WorkoutSession
    newAchievements: Achievement[]
  } | null>(null)

  useEffect(() => {
    if (user?.uid) load(user.uid)
  }, [user?.uid])

  const handleStartSession = useCallback(() => {
    startSession()
    setView('session')
  }, [startSession])

  const handleSessionFinish = useCallback(
    async (performed: PerformedExercise[]) => {
      // Set the final performed list on the active session before finishing
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
        setView('dashboard')
      }
    },
    [finishSession]
  )

  const handleSessionAbort = useCallback(() => {
    setView('dashboard')
  }, [])

  const handleSummaryDone = useCallback(() => {
    setSummaryData(null)
    setView('dashboard')
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

  const showBack = view !== 'dashboard'

  return (
    <>
      <Header title={VIEW_TITLES[view]} />
      {showBack && (
        <div className="sticky top-[57px] z-30 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            <ArrowLeft size={16} />
            Zurück
          </button>
        </div>
      )}

      <PageWrapper>
        {loading && view === 'dashboard' ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <WorkoutDashboard
                onNavigate={setView}
                onStartSession={handleStartSession}
              />
            )}
            {view === 'library' && <ExerciseLibrary onBack={() => setView('dashboard')} />}
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
