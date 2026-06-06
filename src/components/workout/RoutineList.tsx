import { useState } from 'react'
import { Plus, ListChecks } from 'lucide-react'
import type { Routine } from '../../types/routine'
import { useRoutineStore } from '../../stores/routineStore'
import { getDueRoutines } from '../../utils/workout/routineUtils'
import { RoutineCard } from './RoutineCard'
import { RoutineBuilder } from './RoutineBuilder'

interface RoutineListProps {
  onStartRoutine: (routine: Routine) => void
}

export function RoutineList({ onStartRoutine }: RoutineListProps) {
  const { routines, saveRoutine, updateRoutine, removeRoutine, loading } = useRoutineStore()
  const [editing, setEditing] = useState<Routine | null | 'new'>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const dueIds = new Set(getDueRoutines(routines, new Date()).map((r) => r.id))

  if (editing !== null) {
    return (
      <div className="space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">
          {editing === 'new' ? 'Neue Routine' : 'Routine bearbeiten'}
        </h2>
        <RoutineBuilder
          existing={editing === 'new' ? undefined : editing}
          onSave={async (data) => {
            if (editing === 'new') {
              await saveRoutine(data)
            } else {
              await updateRoutine(editing.id, data)
            }
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    )
  }

  if (deletingId) {
    const routine = routines.find((r) => r.id === deletingId)
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <ListChecks size={40} className="text-rose-400" />
        <p className="font-semibold text-gray-900 dark:text-white text-center">
          „{routine?.name}" löschen?
        </p>
        <p className="text-sm text-gray-400 text-center">
          Diese Aktion kann nicht rückgängig gemacht werden. Abgeschlossene Sessions bleiben erhalten.
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => setDeletingId(null)}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300"
          >
            Abbrechen
          </button>
          <button
            onClick={async () => {
              await removeRoutine(deletingId)
              setDeletingId(null)
            }}
            className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-sm font-semibold"
          >
            Löschen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{routines.length} Routine{routines.length !== 1 ? 'n' : ''}</p>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 bg-primary-50 dark:bg-primary-950/30 px-3 py-1.5 rounded-full"
        >
          <Plus size={14} /> Neue Routine
        </button>
      </div>

      {loading && routines.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && routines.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-3 text-center">
          <ListChecks size={40} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400">
            Noch keine Routinen. Erstelle deine erste Routine!
          </p>
          <button
            onClick={() => setEditing('new')}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary-500/20"
          >
            <Plus size={16} /> Erste Routine erstellen
          </button>
        </div>
      )}

      <div className="space-y-3">
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            isDue={dueIds.has(routine.id)}
            onStart={() => onStartRoutine(routine)}
            onEdit={() => setEditing(routine)}
            onDelete={() => setDeletingId(routine.id)}
            onToggleActive={() =>
              updateRoutine(routine.id, { isActive: !routine.isActive })
            }
          />
        ))}
      </div>
    </div>
  )
}
