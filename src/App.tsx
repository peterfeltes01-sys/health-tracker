import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { BottomNav } from './components/layout/BottomNav'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Activities } from './pages/Activities'
import { Stats } from './pages/Stats'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { useSettingsStore } from './stores/settingsStore'
import { useStepsStore } from './stores/stepsStore'
import { useActivitiesStore } from './stores/activitiesStore'
import { useHydrationStore } from './stores/hydrationStore'
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
        {/* Public auth routes — redirect to dashboard if already logged in */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />

        {/* Protected app routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Fallback */}
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
