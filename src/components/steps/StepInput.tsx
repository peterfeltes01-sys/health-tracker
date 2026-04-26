import { useState } from 'react'
import { Input } from '../shared/Input'
import { Button } from '../shared/Button'
import { toISODate } from '../../utils/calculations'

interface StepInputProps {
  onAdd: (steps: number, date: string, time?: string) => void
  onClose: () => void
}

export function StepInput({ onAdd, onClose }: StepInputProps) {
  const [steps, setSteps] = useState('')
  const [date, setDate] = useState(toISODate(new Date()))
  const [time, setTime] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const n = parseInt(steps)
    if (!n || n < 1) { setError('Bitte gültige Schrittzahl eingeben'); return }
    onAdd(n, date, time || undefined)
    onClose()
  }

  return (
    <div className="space-y-4">
      <Input
        label="Schrittzahl *"
        type="number"
        min="1"
        value={steps}
        onChange={(e) => { setSteps(e.target.value); setError('') }}
        error={error}
        placeholder="z.B. 5000"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Datum" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Uhrzeit" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onClose}>Abbrechen</Button>
        <Button fullWidth onClick={handleSubmit}>Hinzufügen</Button>
      </div>
    </div>
  )
}
