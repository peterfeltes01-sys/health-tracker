import { useNavigate } from 'react-router-dom'
import { BarChart2, Settings, ChevronRight, Footprints, UtensilsCrossed, Wind, ClipboardList } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'

const ITEMS = [
  { icon: ClipboardList,   label: 'Notizen',           desc: 'Boards · Checklisten · Erinnerungen',      to: '/notes',              color: 'text-indigo-500' },
  { icon: Wind,            label: 'Atemübungen',       desc: 'Stress abbauen · Beruhigen · Schlafen',    to: '/breathing',          color: 'text-teal-500' },
  { icon: Footprints,      label: 'Schritte-Verlauf',  desc: 'Tägliche Schritte & Zielerreichung',       to: '/steps-history',      color: 'text-emerald-500' },
  { icon: UtensilsCrossed, label: 'Ernährungs-Verlauf', desc: 'Kalorien & Mahlzeiten der letzten Tage', to: '/nutrition/history',  color: 'text-rose-500' },
  { icon: BarChart2,       label: 'Statistiken',       desc: 'Aktivitäten & Wochenziele',                to: '/stats',              color: 'text-purple-500' },
  { icon: Settings,        label: 'Einstellungen',     desc: 'Ziele, Profil & Daten',                    to: '/settings',           color: 'text-gray-500' },
]

export function MorePage() {
  const navigate = useNavigate()

  return (
    <>
      <Header title="Mehr" />
      <PageWrapper>
        <div className="space-y-2">
          {ITEMS.map(({ icon: Icon, label, desc, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className={`p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 ${color}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </PageWrapper>
    </>
  )
}
