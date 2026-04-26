import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { sendPasswordResetEmail, type AuthError } from 'firebase/auth'
import { Activity, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export function ForgotPasswordPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) return setError('Bitte E-Mail-Adresse eingeben.')
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setSent(true)
    } catch (err) {
      const ae = err as AuthError
      if (ae.code === 'auth/user-not-found' || ae.code === 'auth/invalid-email') {
        setSent(true)
      } else {
        setError('Fehler beim Senden. Bitte erneut versuchen.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-gray-950 dark:to-gray-900 px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Health<span className="text-primary-500">Track</span>
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/60 dark:shadow-none border border-gray-100 dark:border-gray-800 p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-primary-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                E-Mail gesendet
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Falls ein Konto mit <strong className="text-gray-700 dark:text-gray-300">{email}</strong> existiert, wurde ein Reset-Link gesendet. Bitte auch den Spam-Ordner prüfen.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                <ArrowLeft size={16} /> Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Passwort zurücksetzen
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    E-Mail
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@beispiel.de"
                      autoComplete="email"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Senden…
                    </span>
                  ) : (
                    'Reset-Link senden'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              <ArrowLeft size={14} /> Zurück zur Anmeldung
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
