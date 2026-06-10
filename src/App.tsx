import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { BottomNav } from './components/layout/BottomNav'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Activities } from './pages/Activities'
import { Stats } from './pages/Stats'
import { History } from './pages/History'
import { StepsHistory } from './pages/StepsHistory'
import { NutritionHistory } from './pages/NutritionHistory'
import { Settings } from './pages/Settings'
import { NutritionPage } from './pages/NutritionPage'
import { MealEditPage } from './pages/MealEditPage'
import { CustomProductsPage } from './pages/CustomProductsPage'
import { ValuesPage } from './pages/ValuesPage'
import { MorePage } from './pages/MorePage'
import { BreathingPage } from './pages/BreathingPage'
import { NotesPage } from './pages/NotesPage'
import { ReminderModal } from './components/notes/ReminderModal'
import { HabitsPage } from './pages/HabitsPage'
import { HabitDetailPage } from './pages/HabitDetailPage'
import { HabitFormPage } from './pages/HabitFormPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { useSettingsStore } from './stores/settingsStore'
import { useStepsStore } from './stores/stepsStore'
import { useActivitiesStore } from './stores/activitiesStore'
import { useHydrationStore } from './stores/hydrationStore'
import { useNutritionStore } from './stores/nutritionStore'
import { useWeightStore } from './stores/weightStore'
import { useBloodPressureStore } from './stores/bloodPressureStore'
import { useBodyMeasurementStore } from './stores/bodyMeasurementStore'
import { useCholesterolStore } from './stores/cholesterolStore'
import { useBloodSugarStore } from './stores/bloodSugarStore'
import { useNotesStore } from './stores/notesStore'
import { useHabitStore } from './stores/habitStore'
import { useWorkoutStore } from './stores/workoutStore'
import { useRoutineStore } from './stores/routineStore'
import { useExerciseMediaStore } from './stores/exerciseMediaStore'
import { useAuth } from './hooks/useAuth'
import { setRepository } from './lib/repositoryRegistry'
import { setHabitRepository } from './lib/habitRepositoryRegistry'
import { setWorkoutRepository } from './lib/workoutRepositoryRegistry'
import { setRoutineRepository } from './lib/routineRepositoryRegistry'
import { setExerciseMediaRepository } from './lib/exerciseMediaRepositoryRegistry'
import { setMediaUploader } from './lib/mediaUploaderRegistry'
import { setMovementFamilyRepository } from './lib/movementFamilyRepositoryRegistry'
import { setReadinessRepository } from './lib/readinessRepositoryRegistry'
import { setProgressionDecisionRepository } from './lib/progressionDecisionRepositoryRegistry'
import { FirebaseMediaUploader, NoOpMediaUploader } from './lib/mediaUploader'
import { WorkoutFirestoreRepository } from './repositories/WorkoutFirestoreRepository'
import { WorkoutLocalStorageRepository } from './repositories/WorkoutLocalStorageRepository'
import { FirestoreRepository } from './repositories/FirestoreRepository'
import { LocalStorageRepository } from './repositories/LocalStorageRepository'
import { HabitFirestoreRepository } from './repositories/HabitFirestoreRepository'
import { HabitLocalRepository } from './repositories/HabitLocalRepository'
import { RoutineFirestoreRepository } from './repositories/RoutineFirestoreRepository'
import { RoutineLocalStorageRepository } from './repositories/RoutineLocalStorageRepository'
import { ExerciseMediaFirestoreRepository } from './repositories/ExerciseMediaFirestoreRepository'
import { ExerciseMediaLocalStorageRepository } from './repositories/ExerciseMediaLocalStorageRepository'
import { MovementFamilyFirestoreRepository } from './repositories/MovementFamilyFirestoreRepository'
import { MovementFamilyLocalStorageRepository } from './repositories/MovementFamilyLocalStorageRepository'
import { ReadinessFirestoreRepository } from './features/training/repositories/ReadinessFirestoreRepository'
import { ReadinessLocalStorageRepository } from './features/training/repositories/ReadinessLocalStorageRepository'
import { ProgressionDecisionFirestoreRepository } from './features/training/repositories/ProgressionDecisionFirestoreRepository'
import { ProgressionDecisionLocalStorageRepository } from './features/training/repositories/ProgressionDecisionLocalStorageRepository'
import { useProgressionStore } from './features/training/store/progressionSlice'
import { useReadinessStore } from './features/training/store/readinessSlice'
import { BalancePage } from './pages/BalancePage'

function ThemeController() {
  const theme = useSettingsStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }, [theme])

  return null
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse">
          <Activity size={28} className="text-white" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">Wird geladen…</p>
      </div>
    </div>
  )
}

function AppCore() {
  const { user, loading: authLoading } = useAuth()
  const { loaded: settingsLoaded, load: loadSettings, reset: resetSettings } = useSettingsStore()

  useEffect(() => {
    if (authLoading) return

    if (user) {
      setRepository(new FirestoreRepository(user.uid))
      setHabitRepository(new HabitFirestoreRepository(user.uid))
      setWorkoutRepository(new WorkoutFirestoreRepository(user.uid))
      setRoutineRepository(new RoutineFirestoreRepository(user.uid))
      setExerciseMediaRepository(new ExerciseMediaFirestoreRepository(user.uid))
      setMovementFamilyRepository(new MovementFamilyFirestoreRepository(user.uid))
      setReadinessRepository(new ReadinessFirestoreRepository(user.uid))
      setProgressionDecisionRepository(new ProgressionDecisionFirestoreRepository(user.uid))
      setMediaUploader(new FirebaseMediaUploader())
      useExerciseMediaStore.getState().setUid(user.uid)
      loadSettings()
      useNotesStore.getState().load()
      useHabitStore.getState().load()
    } else {
      useStepsStore.getState().reset()
      useActivitiesStore.getState().reset()
      useHydrationStore.getState().reset()
      useNutritionStore.getState().reset()
      useWeightStore.getState().reset()
      useBloodPressureStore.getState().reset()
      useBodyMeasurementStore.getState().reset()
      useCholesterolStore.getState().reset()
      useBloodSugarStore.getState().reset()
      useNotesStore.getState().reset()
      useHabitStore.getState().reset()
      useWorkoutStore.getState().reset()
      useRoutineStore.getState().reset()
      useExerciseMediaStore.getState().reset()
      resetSettings()
      setRepository(new LocalStorageRepository())
      setHabitRepository(new HabitLocalRepository())
      setWorkoutRepository(new WorkoutLocalStorageRepository())
      setRoutineRepository(new RoutineLocalStorageRepository())
      setExerciseMediaRepository(new ExerciseMediaLocalStorageRepository())
      setMovementFamilyRepository(new MovementFamilyLocalStorageRepository())
      setReadinessRepository(new ReadinessLocalStorageRepository())
      setProgressionDecisionRepository(new ProgressionDecisionLocalStorageRepository())
      useProgressionStore.getState().reset()
      useReadinessStore.getState().reset()
      setMediaUploader(new NoOpMediaUploader())
    }
  }, [user?.uid, authLoading])

  if (authLoading || (user && !settingsLoaded)) {
    return <LoadingScreen />
  }

  return (
    <>
      <ThemeController />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/steps-history" element={<ProtectedRoute><StepsHistory /></ProtectedRoute>} />
        <Route path="/nutrition/history" element={<ProtectedRoute><NutritionHistory /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/nutrition" element={<ProtectedRoute><NutritionPage /></ProtectedRoute>} />
        <Route path="/nutrition/meal/:id?" element={<ProtectedRoute><MealEditPage /></ProtectedRoute>} />
        <Route path="/nutrition/products" element={<ProtectedRoute><CustomProductsPage /></ProtectedRoute>} />
        <Route path="/values" element={<ProtectedRoute><ValuesPage /></ProtectedRoute>} />
        <Route path="/more" element={<ProtectedRoute><MorePage /></ProtectedRoute>} />
        <Route path="/breathing" element={<ProtectedRoute><BreathingPage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
        <Route path="/habits/new" element={<ProtectedRoute><HabitFormPage /></ProtectedRoute>} />
        <Route path="/habits/:id/edit" element={<ProtectedRoute><HabitFormPage /></ProtectedRoute>} />
        <Route path="/habits/:id" element={<ProtectedRoute><HabitDetailPage /></ProtectedRoute>} />
        <Route path="/workout" element={<ProtectedRoute><WorkoutPage /></ProtectedRoute>} />
        <Route path="/balance" element={<ProtectedRoute><BalancePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>

      {user && <BottomNav />}
      {user && <ReminderModal />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppCore />
    </BrowserRouter>
  )
}
