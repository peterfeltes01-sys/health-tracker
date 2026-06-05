import { useState } from 'react'
import { Plus, Minus, Save, Trash2, AlertCircle } from 'lucide-react'
import type { ExerciseMode, MuscleGroup, CustomExercise } from '../../types/workout'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useAuth } from '../../hooks/useAuth'

const MODE_LABELS: Record<ExerciseMode, string> = {
  bodyweight: 'Körpergewicht',
  bands: 'Expander',
  chair: 'Stuhl',
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  brust: 'Brust', ruecken: 'Rücken', schultern: 'Schultern', arme: 'Arme',
  beine: 'Beine', gesaess: 'Gesäß', rumpf: 'Rumpf', ganzkoerper: 'Ganzkörper',
}

const ALL_MODES: ExerciseMode[] = ['bodyweight', 'bands', 'chair']
const ALL_MUSCLES: MuscleGroup[] = ['brust', 'ruecken', 'schultern', 'arme', 'beine', 'gesaess', 'rumpf', 'ganzkoerper']

interface CustomExerciseFormProps {
  existing?: CustomExercise
  onSaved: () => void
  onCancel: () => void
}

export function CustomExerciseForm({ existing, onSaved, onCancel }: CustomExerciseFormProps) {
  const { user } = useAuth()
  const { addCustomExercise, updateCustomExercise, deleteCustomExercise } = useWorkoutStore()

  const [name, setName] = useState(existing?.name ?? '')
  const [modes, setModes] = useState<ExerciseMode[]>(existing?.modes ?? ['bodyweight'])
  const [primaryMuscles, setPrimaryMuscles] = useState<MuscleGroup[]>(existing?.primaryMuscles ?? [])
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>(existing?.secondaryMuscles ?? [])
  const [difficulty, setDifficulty] = useState<'leicht' | 'mittel' | 'schwer'>(existing?.difficulty ?? 'mittel')
  const [targetType, setTargetType] = useState<'reps' | 'duration'>(existing?.target.type ?? 'reps')
  const [sets, setSets] = useState(existing?.target.type === 'reps' ? existing.target.sets : existing?.target.type === 'duration' ? existing.target.sets : 2)
  const [reps, setReps] = useState(existing?.target.type === 'reps' ? existing.target.reps : 12)
  const [seconds, setSeconds] = useState(existing?.target.type === 'duration' ? existing.target.seconds : 30)
  const [basePoints, setBasePoints] = useState(existing?.basePoints ?? 10)
  const [instructions, setInstructions] = useState<string[]>(existing?.instructions ?? [''])
  const [chairNote, setChairNote] = useState(existing?.chairVariantNote ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
        <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
        Einloggen, um eigene Übungen zu erstellen.
      </div>
    )
  }

  const toggleMode = (m: ExerciseMode) =>
    setModes((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])

  const toggleMuscle = (m: MuscleGroup, primary: boolean) => {
    if (primary) {
      setPrimaryMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
    } else {
      setSecondaryMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Name ist Pflichtfeld.'); return }
    if (modes.length === 0) { setError('Mindestens einen Modus wählen.'); return }
    if (primaryMuscles.length === 0) { setError('Mindestens einen Hauptmuskel wählen.'); return }

    setSaving(true)
    setError(null)
    try {
      const target =
        targetType === 'reps'
          ? ({ type: 'reps', sets, reps } as const)
          : ({ type: 'duration', sets, seconds } as const)

      const data = {
        name: name.trim(),
        modes,
        primaryMuscles,
        secondaryMuscles,
        difficulty,
        target,
        basePoints,
        instructions: instructions.filter((s) => s.trim()),
        chairVariantNote: chairNote.trim() || undefined,
        media: existing?.media ?? [],
      }

      if (existing) {
        await updateCustomExercise({ ...existing, ...data })
      } else {
        await addCustomExercise(data)
      }
      onSaved()
    } catch {
      setError('Speichern fehlgeschlagen.')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!existing) return
    if (!confirm(`„${existing.name}" wirklich löschen?`)) return
    setDeleting(true)
    try {
      await deleteCustomExercise(existing.id)
      onSaved()
    } catch {
      setError('Löschen fehlgeschlagen.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Kettlebell Swing"
          className="mt-1.5 w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-400"
        />
      </div>

      {/* Modes */}
      <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Modi *</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ALL_MODES.map((m) => (
            <button
              key={m}
              onClick={() => toggleMode(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                modes.includes(m) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Primary muscles */}
      <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hauptmuskeln *</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ALL_MUSCLES.map((m) => (
            <button
              key={m}
              onClick={() => toggleMuscle(m, true)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                primaryMuscles.includes(m) ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {MUSCLE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary muscles */}
      <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hilfsmuskeln</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {ALL_MUSCLES.map((m) => (
            <button
              key={m}
              onClick={() => toggleMuscle(m, false)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                secondaryMuscles.includes(m) ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {MUSCLE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty + Points */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Schwierigkeit</label>
          <div className="mt-1.5 flex gap-1">
            {(['leicht', 'mittel', 'schwer'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  difficulty === d
                    ? d === 'leicht' ? 'bg-emerald-500 text-white' : d === 'mittel' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Punkte</label>
          <div className="mt-1.5 flex items-center gap-2">
            <button onClick={() => setBasePoints((p) => Math.max(1, p - 1))} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <Minus size={14} />
            </button>
            <span className="flex-1 text-center text-base font-bold text-gray-900 dark:text-white">{basePoints}</span>
            <button onClick={() => setBasePoints((p) => p + 1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Target */}
      <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Soll-Vorgabe</label>
        <div className="mt-1.5 flex gap-2 mb-3">
          {(['reps', 'duration'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTargetType(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                targetType === t ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              {t === 'reps' ? 'Wiederholungen' : 'Dauer'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400">Sätze</label>
            <input type="number" min={1} max={5} value={sets} onChange={(e) => setSets(parseInt(e.target.value) || 1)}
              className="mt-0.5 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-center font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400">{targetType === 'reps' ? 'Wdh.' : 'Sekunden'}</label>
            {targetType === 'reps' ? (
              <input type="number" min={1} value={reps} onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                className="mt-0.5 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-center font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-400" />
            ) : (
              <input type="number" min={5} step={5} value={seconds} onChange={(e) => setSeconds(parseInt(e.target.value) || 30)}
                className="mt-0.5 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-center font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary-400" />
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Anleitung</label>
        <div className="mt-1.5 space-y-2">
          {instructions.map((step, i) => (
            <div key={i} className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 mt-2.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <input
                value={step}
                onChange={(e) => setInstructions((prev) => prev.map((s, j) => j === i ? e.target.value : s))}
                placeholder={`Schritt ${i + 1}`}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-400"
              />
              {instructions.length > 1 && (
                <button onClick={() => setInstructions((prev) => prev.filter((_, j) => j !== i))} className="mt-1.5 p-1.5 text-gray-300 dark:text-gray-600 hover:text-rose-400">
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
          {instructions.length < 8 && (
            <button onClick={() => setInstructions((prev) => [...prev, ''])} className="flex items-center gap-1 text-xs text-primary-500 font-medium mt-1">
              <Plus size={14} /> Schritt hinzufügen
            </button>
          )}
        </div>
      </div>

      {/* Chair note */}
      <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stuhl-Variante (optional)</label>
        <input
          value={chairNote}
          onChange={(e) => setChairNote(e.target.value)}
          placeholder="Hinweis zur sitzenden Variante…"
          className="mt-1.5 w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-400"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {existing && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-3 bg-rose-50 dark:bg-rose-950/30 text-rose-500 font-semibold rounded-2xl text-sm disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? '…' : 'Löschen'}
          </button>
        )}
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold rounded-2xl text-sm">
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-primary-500/25 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Speichern…' : existing ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </div>
  )
}
