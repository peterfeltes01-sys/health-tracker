import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Utensils, Activity, MoreHorizontal } from 'lucide-react'
import { clsx } from 'clsx'

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/activities', icon: Dumbbell, label: 'Aktivitäten' },
  { to: '/nutrition', icon: Utensils, label: 'Ernährung' },
  { to: '/values', icon: Activity, label: 'Werte' },
  { to: '/more', icon: MoreHorizontal, label: 'Mehr' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors',
                isActive
                  ? 'text-primary-500'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'p-1.5 rounded-xl transition-all',
                  isActive && 'bg-primary-50 dark:bg-primary-950'
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
