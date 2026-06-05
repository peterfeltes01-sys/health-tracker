import { useRef, useState } from 'react'
import { Upload, Trash2, Image, Video, AlertCircle, Check, RefreshCw } from 'lucide-react'
import type { ExerciseMediaOverride, MediaItem } from '../../types/workout'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useAuth } from '../../hooks/useAuth'

const MAX_IMAGE_MB = 5
const MAX_VIDEO_MB = 50

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface MediaUploadPanelProps {
  exerciseId: string
  override?: ExerciseMediaOverride
}

export function MediaUploadPanel({ exerciseId, override }: MediaUploadPanelProps) {
  const { user } = useAuth()
  const { uploadExerciseMedia, deleteExerciseMediaItem } = useWorkoutStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [strategy, setStrategy] = useState<'append' | 'replace'>(override?.strategy ?? 'append')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
        <AlertCircle size={16} className="flex-shrink-0 text-amber-400" />
        Einloggen, um eigene Medien hochzuladen.
      </div>
    )
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setError(null)
    setSuccess(false)

    try {
      await uploadExerciseMedia(exerciseId, file, strategy, (pct) => setProgress(pct))
      setProgress(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setProgress(null)
      const msg = String(err)
      if (msg.includes('IMAGE_TOO_LARGE')) setError(`Bild zu groß (max. ${MAX_IMAGE_MB} MB)`)
      else if (msg.includes('VIDEO_TOO_LARGE')) setError(`Video zu groß (max. ${MAX_VIDEO_MB} MB)`)
      else if (msg.includes('INVALID_FILE_TYPE')) setError('Nur Bilder und Videos erlaubt.')
      else setError('Upload fehlgeschlagen. Prüfe deine Firebase Blaze-Abrechnung.')
    }
  }

  const handleDelete = async (item: MediaItem) => {
    setDeleting(item.storagePath)
    try {
      await deleteExerciseMediaItem(exerciseId, item.storagePath)
    } catch {
      setError('Löschen fehlgeschlagen.')
    }
    setDeleting(null)
  }

  const existing = override?.customMedia ?? []

  return (
    <div className="mt-4 space-y-3">
      {/* Strategy toggle */}
      <div className="flex gap-2">
        {(['append', 'replace'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStrategy(s)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              strategy === s
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {s === 'append' ? 'Ergänzen' : 'Ersetzen'}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-400">
        {strategy === 'append'
          ? 'Eigene Medien werden nach den Standard-Fotos angezeigt.'
          : 'Eigene Medien ersetzen die Standard-Fotos vollständig.'}
      </p>

      {/* Existing media */}
      {existing.length > 0 && (
        <div className="space-y-2">
          {existing.map((item) => (
            <div key={item.storagePath} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                {item.type === 'image' ? (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={18} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {item.type === 'image' ? <Image size={12} className="text-gray-400" /> : <Video size={12} className="text-gray-400" />}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatSize(item.sizeBytes)}</span>
                </div>
                <p className="text-[10px] text-gray-400">{new Date(item.uploadedAt).toLocaleDateString('de-DE')}</p>
              </div>
              <button
                onClick={() => handleDelete(item)}
                disabled={deleting === item.storagePath}
                className="p-2 text-rose-400 hover:text-rose-600 disabled:opacity-50"
              >
                {deleting === item.storagePath ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFile}
      />

      {progress !== null ? (
        <div className="space-y-1.5">
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-400">{progress}% hochgeladen…</p>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className={`w-full py-3 rounded-2xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            success
              ? 'border-emerald-300 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-primary-300 hover:text-primary-500'
          }`}
        >
          {success ? (
            <><Check size={16} /> Hochgeladen!</>
          ) : (
            <><Upload size={16} /> Bild oder Video hochladen</>
          )}
        </button>
      )}

      <p className="text-[10px] text-gray-400 text-center">
        Bilder max. {MAX_IMAGE_MB} MB · Videos max. {MAX_VIDEO_MB} MB (kurze Demo-Clips empfohlen)
      </p>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-xl p-2.5">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
