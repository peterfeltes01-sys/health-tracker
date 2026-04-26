import { Plus, Droplets, Footprints } from 'lucide-react'
import { useHydrationStore } from '../../stores/hydrationStore'
import { useStepsStore } from '../../stores/stepsStore'
import { useSettingsStore } from '../../stores/settingsStore'

interface QuickActionsProps {
  onAddActivity: () => void
}

export function QuickActions({ onAddActivity }: QuickActionsProps) {
  const addHydration = useHydrationStore((s) => s.addHydration)
  const addSteps = useStepsStore((s) => s.addSteps)
  const quickAddAmounts = useSettingsStore((s) => s.settings.quickAddAmounts)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schnellzugriff</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => addSteps(500)}
          className="flex items-center gap-3 bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900 rounded-2xl p-4 text-left active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Footprints size={20} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-primary-700 dark:text-primary-400 text-sm">+500</div>
            <div className="text-xs text-primary-600/70 dark:text-primary-500/70">Schritte</div>
          </div>
        </button>

        <button
          onClick={onAddActivity}
          className="flex items-center gap-3 bg-accent-50 dark:bg-orange-950/30 border border-accent-100 dark:border-orange-900/50 rounded-2xl p-4 text-left active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plus size={20} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-accent-700 dark:text-accent-400 text-sm">Aktivität</div>
            <div className="text-xs text-accent-600/70 dark:text-accent-500/70">hinzufügen</div>
          </div>
        </button>
      </div>

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
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">+{ml >= 1000 ? `${ml/1000}L` : ml}</div>
              <div className="text-[10px] text-blue-500/70 dark:text-blue-500">ml</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
