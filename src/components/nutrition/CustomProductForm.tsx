import { useState } from 'react'
import type { FoodProduct, NutritionFacts } from '../../types'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'

interface Props {
  initial?: FoodProduct
  onSave: (product: Omit<FoodProduct, 'id' | 'source'>) => void
  onCancel: () => void
}

export function CustomProductForm({ initial, onSave, onCancel }: Props) {
  const p = initial?.per100g
  const [name, setName] = useState(initial?.name ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [serving, setServing] = useState(initial?.defaultServingGrams?.toString() ?? '')
  const [kcal, setKcal] = useState(p?.kcal.toString() ?? '')
  const [carbs, setCarbs] = useState(p?.carbs.toString() ?? '')
  const [sugars, setSugars] = useState(p?.sugars?.toString() ?? '')
  const [fat, setFat] = useState(p?.fat.toString() ?? '')
  const [satFat, setSatFat] = useState(p?.satFat.toString() ?? '')
  const [protein, setProtein] = useState(p?.protein.toString() ?? '')
  const [fiber, setFiber] = useState(p?.fiber?.toString() ?? '')
  const [salt, setSalt] = useState(p?.salt?.toString() ?? '')

  function n(v: string): number { return parseFloat(v) || 0 }
  function opt(v: string): number | undefined { const f = parseFloat(v); return isFinite(f) ? f : undefined }

  function handleSubmit() {
    if (!name.trim()) return
    const per100g: NutritionFacts = {
      kcal: n(kcal),
      carbs: n(carbs),
      sugars: opt(sugars),
      fat: n(fat),
      satFat: n(satFat),
      protein: n(protein),
      fiber: opt(fiber),
      salt: opt(salt),
    }
    onSave({
      name: name.trim(),
      brand: brand.trim() || undefined,
      per100g,
      defaultServingGrams: opt(serving),
    })
  }

  return (
    <div className="space-y-4">
      <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Haferflocken" />
      <Input label="Marke (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
      <Input label="Standard-Portion (g, optional)" type="number" value={serving} onChange={(e) => setServing(e.target.value)} />

      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nährwerte pro 100 g</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="kcal *" type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          <Input label="Kohlenhydrate (g) *" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <Input label="davon Zucker (g)" type="number" value={sugars} onChange={(e) => setSugars(e.target.value)} />
          <Input label="Fett (g) *" type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
          <Input label="ges. Fettsäuren (g)" type="number" value={satFat} onChange={(e) => setSatFat(e.target.value)} />
          <Input label="Eiweiß (g) *" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <Input label="Ballaststoffe (g)" type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} />
          <Input label="Salz (g)" type="number" value={salt} onChange={(e) => setSalt(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth onClick={onCancel}>Abbrechen</Button>
        <Button fullWidth onClick={handleSubmit} disabled={!name.trim()}>
          {initial ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </div>
    </div>
  )
}
