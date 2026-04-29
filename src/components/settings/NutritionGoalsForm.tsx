import { useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'

export function NutritionGoalsForm() {
  const { settings, update } = useSettingsStore()
  const goals = settings.nutritionGoals ?? { dailyKcal: 2000, carbsPercent: 50, fatPercent: 30, proteinPercent: 20 }

  const [kcal, setKcal] = useState(goals.dailyKcal.toString())
  const [carbs, setCarbs] = useState(goals.carbsPercent.toString())
  const [fat, setFat] = useState(goals.fatPercent.toString())
  const [protein, setProtein] = useState(goals.proteinPercent.toString())
  const [saved, setSaved] = useState(false)

  const sum = (parseInt(carbs) || 0) + (parseInt(fat) || 0) + (parseInt(protein) || 0)
  const valid = sum === 100 && parseInt(kcal) > 0

  function autoAdjust(field: 'carbs' | 'fat' | 'protein', val: string) {
    const v = parseInt(val) || 0
    if (field === 'carbs') { setCarbs(val); setProtein(String(Math.max(0, 100 - v - (parseInt(fat) || 0)))) }
    if (field === 'fat') { setFat(val); setProtein(String(Math.max(0, 100 - (parseInt(carbs) || 0) - v))) }
    if (field === 'protein') { setProtein(val) }
  }

  function handleSave() {
    if (!valid) return
    update({
      nutritionGoals: {
        dailyKcal: parseInt(kcal),
        carbsPercent: parseInt(carbs),
        fatPercent: parseInt(fat),
        proteinPercent: parseInt(protein),
      }
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🥗 Ernährungsziele</h3>
      <div className="space-y-3">
        <Input
          label="Tages-kcal-Ziel"
          type="number"
          min="800"
          step="50"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
        />
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Makro-Verteilung (Summe = 100%)</p>
        <div className="grid grid-cols-3 gap-2">
          <Input
            label={`Carbs ${carbs}%`}
            type="number"
            min="0"
            max="100"
            value={carbs}
            onChange={(e) => autoAdjust('carbs', e.target.value)}
          />
          <Input
            label={`Fett ${fat}%`}
            type="number"
            min="0"
            max="100"
            value={fat}
            onChange={(e) => autoAdjust('fat', e.target.value)}
          />
          <Input
            label={`Eiweiß ${protein}%`}
            type="number"
            min="0"
            max="100"
            value={protein}
            onChange={(e) => autoAdjust('protein', e.target.value)}
          />
        </div>
        {sum !== 100 && (
          <p className="text-xs text-red-500">Summe muss 100% ergeben (aktuell: {sum}%)</p>
        )}
        <Button fullWidth onClick={handleSave} disabled={!valid}>
          {saved ? '✓ Gespeichert!' : 'Ernährungsziele speichern'}
        </Button>
      </div>
    </Card>
  )
}
