import { useState } from 'react'
import { Droplets, Trash2 } from 'lucide-react'
import type { HydrationEntry } from '../../types'
import { formatHydration } from '../../utils/formatters'
import { DRINK_TYPES } from '../../utils/constants'
import { useSettingsStore } from '../../stores/settingsStore'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'

interface HydrationTrackerProps {
  entries: HydrationEntry[]
  total: number
  goal: number
  onAdd: (ml: number, type: HydrationEntry['drinkType']) => void
  onDelete: (id: string) => void
}

export function HydrationTracker({ entries, total, goal, onAdd, onDelete }: HydrationTrackerProps) {
  const quickAddAmounts = useSettingsStore((s) => s.settings.quickAddAmounts)
  const [custom, setCustom] = useState('')
  const [drinkType, setDrinkType] = useState<HydrationEntry['drinkType']>('water')
  const pct = Math.min(100, (total / goal) * 100)

  const drinkLabel = (type: HydrationEntry['drinkType']) =>
    DRINK_TYPES.find((d) => d.id === type)?.icon ?? '💧'

  const drinkName = (type: HydrationEntry['drinkType']) =>
    DRINK_TYPES.find((d) => d.id === type)?.label ?? 'Wasser'

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets size={20} />
            <span className="font-semibold">Flüssigkeit heute</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatHydration(total)}</div>
            <div className="text-blue-200 text-xs">von {formatHydration(goal)}</div>
          </div>
        </div>
        <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-white/80 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-blue-200">
          <span>0</span>
          <span className={pct >= 100 ? 'text-white font-bold' : ''}>{Math.round(pct)}%</span>
          <span>{formatHydration(goal)}</span>
        </div>
        {pct >= 100 && (
          <div className="mt-3 bg-white/20 rounded-xl p-2 text-center text-sm font-medium">
            💧 Tagesziel erreicht! Super!
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
        {/* Drink type selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Getränk auswählen</p>
          <div className="flex flex-wrap gap-2">
            {DRINK_TYPES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDrinkType(d.id as HydrationEntry['drinkType'])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                  drinkType === d.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{d.icon}</span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick add */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Schnell hinzufügen <span className="font-normal text-gray-400">({drinkLabel(drinkType)} {drinkName(drinkType)})</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {quickAddAmounts.map((ml) => (
              <button
                key={ml}
                onClick={() => onAdd(ml, drinkType)}
                className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl py-2.5 text-center active:scale-95 transition-transform"
              >
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {ml >= 1000 ? `${ml / 1000}L` : ml}
                </div>
                <div className="text-[10px] text-blue-400">ml</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual amount input */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eigene Menge</p>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              placeholder="Menge in ml"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (custom && parseInt(custom) > 0) {
                  onAdd(parseInt(custom), drinkType)
                  setCustom('')
                }
              }}
              size="md"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Heute</h3>
          {[...entries].reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{drinkLabel(entry.drinkType)}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatHydration(entry.amountMl)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {drinkName(entry.drinkType)} · {new Date(entry.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
