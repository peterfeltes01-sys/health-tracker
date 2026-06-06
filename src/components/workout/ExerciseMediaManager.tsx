import { useState, useRef } from 'react'
import { Star, Trash2, Upload, RotateCcw, ImageOff } from 'lucide-react'
import type { Exercise } from '../../types/workout'
import type { CustomMediaItem } from '../../types/routine'
import { useExerciseMediaStore } from '../../stores/exerciseMediaStore'
import { resolveExerciseMedia } from '../../utils/workout/mediaUtils'

interface ExerciseMediaManagerProps {
  exercise: Exercise
}

export function ExerciseMediaManager({ exercise }: ExerciseMediaManagerProps) {
  const { overrides, addCustomMedia, removeCustomMedia, hideDefault, restoreDefaults, setPrimary } =
    useExerciseMediaStore()

  const override = overrides[exercise.id] ?? null
  const { items, primary } = resolveExerciseMedia(exercise.mediaUrls, override)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CustomMediaItem | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!file.type.startsWith('image/')) {
      setError('Nur Bilder werden unterstützt.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Datei zu groß (max. 10 MB vor Komprimierung).')
      return
    }

    setUploading(true)
    setError(null)
    try {
      await addCustomMedia(exercise.id, file, exercise.mediaUrls, (pct) =>
        setUploadProgress(pct)
      )
    } catch (err) {
      setError(String(err))
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteCustom = async (item: CustomMediaItem) => {
    setConfirmDelete(null)
    try {
      await removeCustomMedia(exercise.id, item)
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors disabled:opacity-50"
        >
          <Upload size={16} />
          {uploading ? `${uploadProgress}% …` : '+ Eigenes Bild hochladen'}
        </button>
      </div>

      {/* Media grid */}
      {items.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-2 text-center">
          <ImageOff size={32} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400">Alle Standardbilder ausgeblendet.<br />Lade ein eigenes Bild hoch oder stelle Standardbilder wieder her.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const isPrimary = primary?.id === item.id
          const customItem = item.kind === 'custom'
            ? (override?.customMedia ?? []).find((m) => m.id === item.id) ?? null
            : null

          return (
            <div
              key={item.id}
              className={`relative rounded-2xl overflow-hidden border-2 transition-colors ${
                isPrimary ? 'border-primary-400' : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <img
                src={item.url}
                alt=""
                className="w-full aspect-video object-cover bg-gray-50 dark:bg-gray-800"
                loading="lazy"
              />

              {/* Badge */}
              <div className="absolute top-1.5 left-1.5 flex gap-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  item.kind === 'custom'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-700/80 text-gray-100'
                }`}>
                  {item.kind === 'custom' ? 'Eigen' : 'Standard'}
                </span>
                {isPrimary && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500 text-white">
                    Primär
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                {!isPrimary && (
                  <button
                    onClick={() => setPrimary(exercise.id, item.id)}
                    className="w-7 h-7 rounded-lg bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow"
                    title="Als Primärbild setzen"
                  >
                    <Star size={14} className="text-amber-500" />
                  </button>
                )}
                {item.kind === 'default' && (
                  <button
                    onClick={() => hideDefault(exercise.id, item.url, exercise.mediaUrls)}
                    className="w-7 h-7 rounded-lg bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow"
                    title="Ausblenden"
                  >
                    <Trash2 size={14} className="text-rose-400" />
                  </button>
                )}
                {item.kind === 'custom' && customItem && (
                  <button
                    onClick={() => setConfirmDelete(customItem)}
                    className="w-7 h-7 rounded-lg bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow"
                    title="Löschen"
                  >
                    <Trash2 size={14} className="text-rose-400" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Restore defaults */}
      {(override?.hiddenDefaults?.length ?? 0) > 0 && (
        <button
          onClick={() => restoreDefaults(exercise.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors"
        >
          <RotateCcw size={14} />
          Standardbilder zurücksetzen ({override?.hiddenDefaults.length} ausgeblendet)
        </button>
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 max-w-xs w-full shadow-xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Bild wirklich löschen?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Das Bild wird dauerhaft aus dem Speicher gelöscht und kann nicht wiederhergestellt werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDeleteCustom(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
