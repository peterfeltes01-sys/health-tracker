import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Activity } from 'lucide-react'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const today = format(new Date(), "EEEE, d. MMMM", { locale: de })

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
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
        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{today}</span>
      </div>
    </header>
  )
}
