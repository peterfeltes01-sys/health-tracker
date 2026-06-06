import { useState } from 'react'
import { Search, X, Plus, Pencil, ImagePlus } from 'lucide-react'
import type { ExerciseMode, MuscleGroup } from '../../types/workout'
import { EXERCISES } from '../../data/exercises'
import { ExerciseDemo } from './ExerciseDemo'
import { ExerciseMediaManager } from './ExerciseMediaManager'
import { CustomExerciseForm } from './CustomExerciseForm'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useExerciseMediaStore } from '../../stores/exerciseMediaStore'
import { resolveExerciseMedia as resolveExerciseMediaNew } from '../../utils/workout/mediaUtils'
import { resolveExerciseMedia, customExerciseToExercise } from '../../utils/workout/mediaResolver'
import type { Exercise } from '../../types/workout'

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
const ALL_MUSCLES: MuscleGroup[] = ['brust', 'ruecken', 'schultern', 'arme', 'beine', 'gesaess', 'rumpf']

const DIFF_COLOR = {
  leicht: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
  mittel: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  schwer: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
}

type DetailView = 'info' | 'media' | 'edit'

interface ExerciseLibraryProps {
  onBack?: () => void
}

export function ExerciseLibrary({ onBack: _onBack }: ExerciseLibraryProps) {
  const { mediaOverrides, customExercises } = useWorkoutStore()
  const { overrides: mediaSettings, loadOverride } = useExerciseMediaStore()

  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<ExerciseMode | null>(null)
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailView, setDetailView] = useState<DetailView>('info')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Combine catalog + custom exercises
  const allExercises: Exercise[] = [
    ...EXERCISES,
    ...customExercises.map(customExerciseToExercise),
  ]

  const filtered = allExercises.filter((e) => {
    if (modeFilter && !e.modes.includes(modeFilter)) return false
    if (muscleFilter && !e.primaryMuscles.includes(muscleFilter) && !e.secondaryMuscles.includes(muscleFilter)) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selectedEx = selectedId ? allExercises.find((e) => e.id === selectedId) : null
  const selectedOverride = selectedId ? mediaOverrides.find((o) => o.exerciseId === selectedId) : undefined
  const selectedMediaSettings = selectedId ? (mediaSettings[selectedId] ?? null) : null
  const resolvedUrls = selectedEx
    ? selectedMediaSettings
      ? resolveExerciseMediaNew(selectedEx.mediaUrls, selectedMediaSettings).items.map((i) => i.url)
      : resolveExerciseMedia(selectedEx, selectedOverride)
    : []
  const isCustomSelected = selectedEx ? customExercises.some((c) => c.id === selectedEx.id) : false
  const customSelected = isCustomSelected ? customExercises.find((c) => c.id === selectedId) : undefined

  if (showCreateForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreateForm(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
          <h2 className="font-bold text-gray-900 dark:text-white">Eigene Übung erstellen</h2>
        </div>
        <CustomExerciseForm
          onSaved={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    )
  }

  if (selectedEx) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedId(null); setDetailView('info') }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
          <h1 className="flex-1 font-bold text-gray-900 dark:text-white text-base truncate">{selectedEx.name}</h1>
          {isCustomSelected && (
            <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
              Eigene
            </span>
          )}
        </div>

        {/* Detail tab bar */}
        <div className="flex gap-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-1">
          {([['info', 'Info'], ['media', 'Medien'], ...(isCustomSelected ? [['edit', 'Bearbeiten']] : [])] as [DetailView, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => {
                setDetailView(v)
                if (v === 'media' && selectedId) loadOverride(selectedId)
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                detailView === v
                  ? 'bg-white dark:bg-gray-800 text-primary-500 shadow-sm'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {detailView === 'info' && (
          <>
            <ExerciseDemo exercise={selectedEx} resolvedUrls={resolvedUrls} className="h-64" />

            <div className="flex flex-wrap gap-2">
              {selectedEx.modes.map((m) => (
                <span key={m} className="text-xs font-semibold bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 px-2.5 py-1 rounded-full">
                  {MODE_LABELS[m]}
                </span>
              ))}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFF_COLOR[selectedEx.difficulty]}`}>
                {selectedEx.difficulty.charAt(0).toUpperCase() + selectedEx.difficulty.slice(1)}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Muskeln</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Primär: </span>
                {selectedEx.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
              </p>
              {selectedEx.secondaryMuscles.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold">Sekundär: </span>
                  {selectedEx.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {selectedEx.target.type === 'reps'
                  ? `${selectedEx.target.sets} × ${selectedEx.target.reps} Wdh.`
                  : `${selectedEx.target.sets} × ${selectedEx.target.seconds}s`}
                {' · '}{selectedEx.basePoints} Punkte
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Ausführung</h3>
              <ol className="space-y-2.5">
                {selectedEx.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {selectedEx.chairVariantNote && (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  🪑 {selectedEx.chairVariantNote}
                </p>
              )}
            </div>

            {/* Quick link to media tab */}
            <button
              onClick={() => setDetailView('media')}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
            >
              <ImagePlus size={16} />
              Eigenes Bild / Video hinzufügen
            </button>
          </>
        )}

        {detailView === 'media' && (
          <>
            {resolvedUrls.length > 0 && (
              <ExerciseDemo exercise={selectedEx} resolvedUrls={resolvedUrls} className="h-48" />
            )}
            <ExerciseMediaManager exercise={selectedEx} />
          </>
        )}

        {detailView === 'edit' && isCustomSelected && customSelected && (
          <CustomExerciseForm
            existing={customSelected}
            onSaved={() => { setSelectedId(null); setDetailView('info') }}
            onCancel={() => setDetailView('info')}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Übung suchen…"
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-primary-300"
        />
      </div>

      {/* Mode filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setModeFilter(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${modeFilter === null ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
          Alle
        </button>
        {ALL_MODES.map((m) => (
          <button key={m} onClick={() => setModeFilter(modeFilter === m ? null : m)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${modeFilter === m ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALL_MUSCLES.map((m) => (
          <button key={m} onClick={() => setMuscleFilter(muscleFilter === m ? null : m)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${muscleFilter === m ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            {MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{filtered.length} Übungen</p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 bg-primary-50 dark:bg-primary-950/30 px-3 py-1.5 rounded-full"
        >
          <Plus size={14} /> Eigene Übung
        </button>
      </div>

      {/* Custom exercises section */}
      {customExercises.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-950/20 rounded-2xl p-3 border border-primary-100 dark:border-primary-900">
          <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-2">Eigene Übungen ({customExercises.length})</p>
          <div className="space-y-2">
            {customExercises.filter((ce) => {
              const ex = customExerciseToExercise(ce)
              if (modeFilter && !ex.modes.includes(modeFilter)) return false
              if (muscleFilter && !ex.primaryMuscles.includes(muscleFilter)) return false
              if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false
              return true
            }).map((ce) => {
              const ex = customExerciseToExercise(ce)
              return (
                <button key={ce.id} onClick={() => { setSelectedId(ce.id); setDetailView('info') }}
                  className="w-full flex items-center gap-3 text-left bg-white dark:bg-gray-900 rounded-xl p-2.5 border border-primary-100 dark:border-primary-900 hover:border-primary-300 transition-colors">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800">
                    <ExerciseDemo exercise={ex} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ex.name}</p>
                    <p className="text-xs text-gray-400">{ex.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}</p>
                  </div>
                  <Pencil size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Catalog exercises */}
      <div className="space-y-2">
        {filtered.filter((e) => !customExercises.some((c) => c.id === e.id)).map((ex) => {
          const override = mediaOverrides.find((o) => o.exerciseId === ex.id)
          const hasCustomMedia = (override?.customMedia?.length ?? 0) > 0
          return (
            <button
              key={ex.id}
              onClick={() => { setSelectedId(ex.id); setDetailView('info') }}
              className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3 text-left hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-800">
                <ExerciseDemo
                  exercise={ex}
                  resolvedUrls={override ? resolveExerciseMedia(ex, override) : undefined}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ex.name}</p>
                  {hasCustomMedia && (
                    <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      +Foto
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ex.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                </p>
                <div className="flex gap-1.5 mt-1">
                  {ex.modes.map((m) => (
                    <span key={m} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                      {MODE_LABELS[m]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-primary-500">{ex.basePoints}P</p>
                <p className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 ${DIFF_COLOR[ex.difficulty]}`}>
                  {ex.difficulty}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
