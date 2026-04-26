import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Activity } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { OnlineIndicator } from './OnlineIndicator'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const today = format(new Date(), "EEEE, d. MMMM", { locale: de })
  const { user } = useAuth()

  const initials = user
    ? (user.displayName ?? user.email ?? '?')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        {/* Left: logo or title */}
        {title ? (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-white">Health</span>
              <span className="text-base font-bold text-primary-500">Track</span>
            </div>
          </div>
        )}

        {/* Right: online status + date + avatar */}
        <div className="flex items-center gap-2">
          <OnlineIndicator />
          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize hidden sm:block">
            {today}
          </span>
          {user && (
            user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
            )
          )}
        </div>
      </div>
    </header>
  )
}
