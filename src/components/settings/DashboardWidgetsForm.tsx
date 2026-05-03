import { useSettingsStore } from '../../stores/settingsStore'
import type { DashboardWidgets } from '../../types'

const WIDGET_OPTIONS: { key: keyof DashboardWidgets; label: string; icon: string }[] = [
  { key: 'shortcuts',  label: 'Schnellzugriff',    icon: '⚡' },
  { key: 'nutrition',  label: 'Ernährung',          icon: '🥗' },
  { key: 'bodyValues', label: 'Gewicht & Blutdruck', icon: '⚖️' },
  { key: 'hydration',  label: 'Flüssigkeit',        icon: '💧' },
  { key: 'steps',      label: 'Schritte',           icon: '👟' },
  { key: 'activities', label: 'Aktivitäten',        icon: '🏃' },
]

export function DashboardWidgetsForm() {
  const { settings, update } = useSettingsStore()
  const widgets = settings.dashboardWidgets

  function toggle(key: keyof DashboardWidgets) {
    update({ dashboardWidgets: { ...widgets, [key]: !widgets[key] } })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800 dark:text-white">Dashboard-Widgets</p>
      <p className="text-xs text-gray-400">Wähle, welche Karten auf dem Dashboard angezeigt werden.</p>
      <div className="space-y-2">
        {WIDGET_OPTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            <div
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
                widgets[key] ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  widgets[key] ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
