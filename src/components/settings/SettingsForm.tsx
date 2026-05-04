import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { CustomActivity } from '../../types'
import { generateId } from '../../utils/calculations'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'

export function SettingsForm() {
  const { settings, update } = useSettingsStore()
  const [stepGoal, setStepGoal] = useState(settings.dailyStepGoal.toString())
  const [waterGoal, setWaterGoal] = useState(settings.dailyHydrationGoalMl.toString())
  const [quickAmounts, setQuickAmounts] = useState(settings.quickAddAmounts.join(', '))
  const [weeklyActGoal, setWeeklyActGoal] = useState((settings.weeklyActivityGoal ?? 5).toString())
  const [saved, setSaved] = useState(false)

  const [newActivity, setNewActivity] = useState({ label: '', icon: '⚡', hasDistance: false, defaultCalPerMin: '4' })

  function handleSave() {
    update({
      dailyStepGoal: parseInt(stepGoal) || 10000,
      dailyHydrationGoalMl: parseInt(waterGoal) || 2500,
      quickAddAmounts: quickAmounts.split(',').map((v) => parseInt(v.trim())).filter(Boolean),
      weeklyActivityGoal: parseInt(weeklyActGoal) || 5,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addCustomActivity() {
    if (!newActivity.label) return
    const ca: CustomActivity = {
      id: generateId(),
      label: newActivity.label,
      icon: newActivity.icon || '⚡',
      hasDistance: newActivity.hasDistance,
      defaultCalPerMin: parseFloat(newActivity.defaultCalPerMin) || 4,
    }
    update({ customActivities: [...settings.customActivities, ca] })
    setNewActivity({ label: '', icon: '⚡', hasDistance: false, defaultCalPerMin: '4' })
  }

  function removeCustomActivity(id: string) {
    update({ customActivities: settings.customActivities.filter((a) => a.id !== id) })
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🎯 Tagesziele</h3>
        <div className="space-y-3">
          <Input
            label="Tagesziel Schritte"
            type="number"
            min="1000"
            step="500"
            value={stepGoal}
            onChange={(e) => setStepGoal(e.target.value)}
          />
          <Input
            label="Tagesziel Wasser (ml)"
            type="number"
            min="500"
            step="250"
            value={waterGoal}
            onChange={(e) => setWaterGoal(e.target.value)}
          />
          <Input
            label="Wasser Quick-Add Mengen (ml, kommagetrennt)"
            value={quickAmounts}
            onChange={(e) => setQuickAmounts(e.target.value)}
            hint="z.B. 150, 250, 330, 500"
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📅 Wochenziele</h3>
        <div className="space-y-3">
          <Input
            label="Wöchentliches Aktivitätsziel (Einheiten)"
            type="number"
            min="1"
            step="1"
            value={weeklyActGoal}
            onChange={(e) => setWeeklyActGoal(e.target.value)}
          />
        </div>
      </Card>

      <Button fullWidth onClick={handleSave}>
        {saved ? '✓ Gespeichert!' : 'Alle Ziele speichern'}
      </Button>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">⚡ Eigene Aktivitäten</h3>
        <div className="space-y-3">
          {settings.customActivities.map((ca) => (
            <div key={ca.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{ca.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{ca.label}</div>
                  <div className="text-xs text-gray-500">{ca.defaultCalPerMin} kcal/min</div>
                </div>
              </div>
              <button
                onClick={() => removeCustomActivity(ca.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Neue Aktivität</p>
            <div className="grid grid-cols-4 gap-2">
              <Input placeholder="Icon" value={newActivity.icon} onChange={(e) => setNewActivity({ ...newActivity, icon: e.target.value })} className="col-span-1" />
              <Input placeholder="Name" value={newActivity.label} onChange={(e) => setNewActivity({ ...newActivity, label: e.target.value })} className="col-span-3" />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="kcal/min"
                value={newActivity.defaultCalPerMin}
                onChange={(e) => setNewActivity({ ...newActivity, defaultCalPerMin: e.target.value })}
                className="flex-1"
              />
              <Button onClick={addCustomActivity} size="md">
                <Plus size={16} /> Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
