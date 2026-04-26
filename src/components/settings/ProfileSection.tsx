import { useState } from 'react'
import { signOut, updateProfile } from 'firebase/auth'
import { LogOut, User, Pencil, Check, X } from 'lucide-react'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../shared/Card'
import { Button } from '../shared/Button'

export function ProfileSection() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  async function handleSaveName() {
    if (!name.trim() || name === user?.displayName) {
      setEditing(false)
      return
    }
    setSaving(true)
    await updateProfile(user!, { displayName: name.trim() })
    setSaving(false)
    setEditing(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await signOut(auth)
  }

  const initials = (user.displayName ?? user.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <User size={18} />
        Profil
      </h3>

      <div className="flex items-center gap-4 mb-5">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt="Profilbild"
            className="w-14 h-14 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800 flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') { setName(user.displayName ?? ''); setEditing(false) }
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => { setName(user.displayName ?? ''); setEditing(false) }}
                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.displayName || 'Kein Name gesetzt'}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex-shrink-0"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{user.email}</p>
        </div>
      </div>

      <Button
        variant="ghost"
        fullWidth
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <LogOut size={16} />
        {loggingOut ? 'Abmelden…' : 'Abmelden'}
      </Button>
    </Card>
  )
}
