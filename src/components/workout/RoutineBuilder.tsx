import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { Routine, RoutineExercise, ExerciseTarget } from '../../types/routine'
import type { Exercise } from '../../types/workout'
import { EXERCISES } from '../../data/exercises'
import { reorderExercises, defaultTargetFromExercise } from '../../utils/workout/routineUtils'

interface TargetEditorProps {
  target: ExerciseTarget
  onChange: (t: ExerciseTarget) => void
}

function TargetEditor({ target, onChange }: TargetEditorProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <select
        value={target.mode}
        onChange={(e) => onChange({ ...target, mode: e.target.value as 'reps' | 'duration' })}
        className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300"
      >
        <option value="reps">Wiederholungen</option>
        <option value="duration">Dauer</option>
      </select>

      <input
        type="number"
        min={1}
        max={10}
        value={target.sets ?? 3}
        onChange={(e) => onChange({ ...target, sets: Number(e.target.value) })}
        className="w-16 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-center text-gray-700 dark:text-gray-300"
        title="Sätze"
      />
      <span className="text-xs text-gray-400 self-center">Sätze</span>

      {target.mode === 'reps' ? (
        <>
          <input
            type="number"
            min={1}
            max={100}
            value={target.reps ?? 10}
            onChange={(e) => onChange({ ...target, reps: Number(e.target.value) })}
            className="w-16 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-center text-gray-700 dark:text-gray-300"
            title="Wiederholungen"
          />
          <span className="text-xs text-gray-400 self-center">Wdh.</span>
        </>
      ) : (
        <>
          <input
            type="number"
            min={5}
            max={300}
            step={5}
            value={target.durationSec ?? 30}
            onChange={(e) => onChange({ ...target, durationSec: Number(e.target.value) })}
            className="w-16 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-center text-gray-700 dark:text-gray-300"
            title="Sekunden"
          />
          <span className="text-xs text-gray-400 self-center">Sek.</span>
        </>
      )}
    </div>
  )
}

interface SortableItemProps {
  item: RoutineExercise
  exercise: Exercise | undefined
  onRemove: () => void
  onTargetChange: (t: ExerciseTarget) => void
}

function SortableItem({ item, exercise, onRemove, onTargetChange }: SortableItemProps) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.exerciseId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          aria-label="Verschieben"
        >
          <GripVertical size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {exercise?.name ?? item.exerciseId}
          </p>
          <p className="text-xs text-gray-400">
            {item.target.mode === 'reps'
              ? `${item.target.sets ?? 3} × ${item.target.reps ?? 10} Wdh.`
              : `${item.target.sets ?? 1} × ${item.target.durationSec ?? 30}s`}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 text-gray-300 hover:text-rose-500 flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-50 dark:border-gray-800">
          <TargetEditor target={item.target} onChange={onTargetChange} />
        </div>
      )}
    </div>
  )
}

interface ExercisePickerProps {
  addedIds: Set<string>
  onAdd: (exercise: Exercise) => void
  onClose: () => void
}

function ExercisePicker({ addedIds, onAdd, onClose }: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const filtered = EXERCISES.filter(
    (e) =>
      !addedIds.has(e.id) &&
      (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-bold text-gray-900 dark:text-white">Übung hinzufügen</h3>
          <button onClick={onClose} className="p-2 text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="px-4 pb-3">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-1.5">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Keine Übungen gefunden</p>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onAdd(ex); onClose() }}
              className="w-full flex items-center gap-3 text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ex.name}</p>
                <p className="text-xs text-gray-400">
                  {ex.target.type === 'reps'
                    ? `${ex.target.sets} × ${ex.target.reps} Wdh.`
                    : `${ex.target.sets} × ${ex.target.seconds}s`}
                  {' · '}{ex.basePoints}P
                </p>
              </div>
              <Plus size={18} className="text-primary-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface RoutineBuilderProps {
  existing?: Routine
  onSave: (data: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
}

export function RoutineBuilder({ existing, onSave, onCancel }: RoutineBuilderProps) {
  const [name, setName] = useState(existing?.name ?? '')
  const [exercises, setExercises] = useState<RoutineExercise[]>(
    existing?.exercises.slice().sort((a, b) => a.order - b.order) ?? []
  )
  const [isActive, setIsActive] = useState(existing?.isActive ?? true)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = exercises.findIndex((e) => e.exerciseId === active.id)
    const toIndex = exercises.findIndex((e) => e.exerciseId === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    setExercises(reorderExercises(exercises, fromIndex, toIndex))
  }, [exercises])

  const handleAdd = useCallback((exercise: Exercise) => {
    const defaultTarget = defaultTargetFromExercise(exercise)
    const newItem: RoutineExercise = {
      exerciseId: exercise.id,
      order: exercises.length,
      target: defaultTarget,
    }
    setExercises((prev) => [...prev, newItem])
  }, [exercises.length])

  const handleRemove = useCallback((exerciseId: string) => {
    setExercises((prev) => {
      const next = prev.filter((e) => e.exerciseId !== exerciseId)
      return next.map((e, i) => ({ ...e, order: i }))
    })
  }, [])

  const handleTargetChange = useCallback((exerciseId: string, target: ExerciseTarget) => {
    setExercises((prev) =>
      prev.map((e) => (e.exerciseId === exerciseId ? { ...e, target } : e))
    )
  }, [])

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        exercises: exercises.map((e, i) => ({ ...e, order: i })),
        schedule: { type: 'daily' },
        isActive,
      })
    } finally {
      setSaving(false)
    }
  }

  const exerciseMap = new Map(EXERCISES.map((e) => [e.id, e]))
  const addedIds = new Set(exercises.map((e) => e.exerciseId))

  return (
    <>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">
            Name der Routine
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Tägliches Core"
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Übungen ({exercises.length})
          </span>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 bg-primary-50 dark:bg-primary-950/30 px-3 py-1.5 rounded-full"
          >
            <Plus size={14} /> Hinzufügen
          </button>
        </div>

        {exercises.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Noch keine Übungen. Füge welche hinzu.</p>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={exercises.map((e) => e.exerciseId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {exercises.map((item) => (
                <SortableItem
                  key={item.exerciseId}
                  item={item}
                  exercise={exerciseMap.get(item.exerciseId)}
                  onRemove={() => handleRemove(item.exerciseId)}
                  onTargetChange={(t) => handleTargetChange(item.exerciseId, t)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsActive((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative ${isActive ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Routine aktiv (täglich fällig)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || exercises.length === 0}
            className="flex-1 py-3 rounded-xl bg-primary-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-primary-500/20"
          >
            <Check size={16} />
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          addedIds={addedIds}
          onAdd={handleAdd}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
