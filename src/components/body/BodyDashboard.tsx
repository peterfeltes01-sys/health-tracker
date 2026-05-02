import { useState } from 'react'
import { useWeightStore } from '../../stores/weightStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { Card } from '../shared/Card'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Untergewicht', color: '#3b82f6' }
  if (bmi < 25.0) return { label: 'Normalgewicht', color: '#22c55e' }
  if (bmi < 30.0) return { label: 'Übergewicht', color: '#f59e0b' }
  if (bmi < 35.0) return { label: 'Adipositas Grad I', color: '#ef4444' }
  return { label: 'Adipositas Grad II+', color: '#b91c1c' }
}

function whrCategory(whr: number) {
  if (whr < 0.85) return { label: 'Gut', color: '#22c55e' }
  if (whr < 0.95) return { label: 'Erhöht', color: '#f59e0b' }
  return { label: 'Hoch', color: '#ef4444' }
}

const BMI_SCALE = [
  { label: '<18.5', color: '#3b82f6' },
  { label: '25', color: '#22c55e' },
  { label: '30', color: '#f59e0b' },
  { label: '35+', color: '#ef4444' },
]

export function BodyDashboard() {
  const { entries } = useWeightStore()
  const { settings, update } = useSettingsStore()

  const [height, setHeight] = useState(String(settings.heightCm && settings.heightCm > 0 ? settings.heightCm : ''))
  const [waist, setWaist]   = useState(String(settings.waistCm  && settings.waistCm  > 0 ? settings.waistCm  : ''))
  const [hip, setHip]       = useState(String(settings.hipCm    && settings.hipCm    > 0 ? settings.hipCm    : ''))
  const [saved, setSaved] = useState(false)

  const latestWeight = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]

  const heightCm = parseFloat(height) || 0
  const waistCm  = parseFloat(waist)  || 0
  const hipCm    = parseFloat(hip)    || 0

  const bmi = heightCm > 0 && latestWeight
    ? latestWeight.weightKg / Math.pow(heightCm / 100, 2)
    : null

  const whr = waistCm > 0 && hipCm > 0 ? waistCm / hipCm : null

  const bmiCat = bmi ? bmiCategory(bmi) : null
  const whrCat = whr ? whrCategory(whr) : null

  // BMI needle position (clamped 15–40, mapped to 0–100%)
  const bmiPos = bmi ? Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100)) : null

  async function handleSave() {
    await update({
      heightCm: heightCm > 0 ? heightCm : undefined,
      waistCm:  waistCm  > 0 ? waistCm  : undefined,
      hipCm:    hipCm    > 0 ? hipCm    : undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* BMI */}
      <Card>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Body Mass Index (BMI)
        </p>

        {bmi ? (
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold tabular-nums" style={{ color: bmiCat?.color }}>
              {bmi.toFixed(1)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{bmiCat?.label}</p>
              <p className="text-xs text-gray-400">
                {latestWeight.weightKg.toFixed(1)} kg · {heightCm} cm
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">
            Größe unten eingeben und Gewicht eintragen um BMI zu berechnen
          </p>
        )}

        {/* Color scale */}
        <div className="relative h-3 rounded-full overflow-hidden flex mb-1">
          <div className="flex-none w-[30%] bg-blue-400" />
          <div className="flex-none w-[30%] bg-green-400" />
          <div className="flex-none w-[20%] bg-yellow-400" />
          <div className="flex-1 bg-red-400" />
          {bmiPos !== null && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-gray-900 dark:bg-white rounded-full"
              style={{ left: `calc(${bmiPos}% - 2px)` }}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          {BMI_SCALE.map((s) => (
            <span key={s.label}>{s.label}</span>
          ))}
        </div>
      </Card>

      {/* WHR */}
      <Card>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Taille-Hüft-Verhältnis (WHR)
        </p>

        {whr ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl font-bold tabular-nums" style={{ color: whrCat?.color }}>
                {whr.toFixed(2)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{whrCat?.label}</p>
                <p className="text-xs text-gray-400">
                  Taille {waistCm} cm · Hüfte {hipCm} cm
                </p>
              </div>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden flex mb-1">
              <div className="flex-none w-[42%] bg-green-400" />
              <div className="flex-none w-[25%] bg-yellow-400" />
              <div className="flex-1 bg-red-400" />
              {(() => {
                const pos = Math.min(100, Math.max(0, ((whr - 0.6) / 0.6) * 100))
                return (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-gray-900 dark:bg-white rounded-full"
                    style={{ left: `calc(${pos}% - 2px)` }}
                  />
                )
              })()}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>&lt;0.85 gut</span>
              <span>0.85 erhöht</span>
              <span>0.95+ hoch</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Taille und Hüfte unten eingeben um WHR zu berechnen
          </p>
        )}
      </Card>

      {/* Measurements input */}
      <Card>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Maße eingeben
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Körpergröße (cm)</label>
            <Input
              type="number"
              placeholder="z.B. 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Taillenumfang (cm)</label>
            <Input
              type="number"
              placeholder="z.B. 82"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Hüftumfang (cm)</label>
            <Input
              type="number"
              placeholder="z.B. 96"
              value={hip}
              onChange={(e) => setHip(e.target.value)}
            />
          </div>
          <Button fullWidth onClick={handleSave}>
            {saved ? '✓ Gespeichert' : 'Speichern'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
