import { Droplets } from 'lucide-react'
import { useHydrationStore } from '../../stores/hydrationStore'
import { useSettingsStore } from '../../stores/settingsStore'

export function QuickActions() {
  const addHydration = useHydrationStore((s) => s.addHydration)
  const quickAddAmounts = useSettingsStore((s) => s.settings.quickAddAmounts)

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Droplets size={18} className="text-blue-500" />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Wasser trinken</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {quickAddAmounts.map((ml) => (
          <button
            key={ml}
            onClick={() => addHydration(ml, 'water')}
            className="bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl py-2 text-center active:scale-95 transition-transform"
          >
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">+{ml >= 1000 ? `${ml / 1000}L` : ml}</div>
            <div className="text-[10px] text-blue-500/70 dark:text-blue-500">ml</div>
          </button>
        ))}
      </div>
    </div>
  )
}
