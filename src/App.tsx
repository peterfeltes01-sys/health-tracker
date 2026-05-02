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
import { useAuth } from './hooks/useAuth'
import { setRepository } from './lib/repositoryRegistry'
import { FirestoreRepository } from './repositories/FirestoreRepository'
import { LocalStorageRepository } from './repositories/LocalStorageRepository'

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
      loadSettings()
    } else {
      useStepsStore.getState().reset()
      useActivitiesStore.getState().reset()
      useHydrationStore.getState().reset()
      useNutritionStore.getState().reset()
      useWeightStore.getState().reset()
      useBloodPressureStore.getState().reset()
      resetSettings()
      setRepository(new LocalStorageRepository())
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

        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>

      {user && <BottomNav />}
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
