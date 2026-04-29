import { Trash2, Edit2 } from 'lucide-react'
import type { BloodPressureEntry } from '../../types'
import { BP_CATEGORY_META } from '../../lib/bloodPressure'

interface Props {
  entries: BloodPressureEntry[]
  onEdit: (entry: BloodPressureEntry) => void
  onDelete: (id: string) => void
}

export function BPList({ entries, onEdit, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">❤️</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noch keine Blutdruckdaten</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Trage deine erste Messung ein</p>
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  let lastDate = ''

  return (
    <div className="space-y-1">
      {sorted.map((entry) => {
        const meta = BP_CATEGORY_META[entry.category]
        const showDate = entry.date !== lastDate
        lastDate = entry.date

        return (
          <div key={entry.id}>
            {showDate && (
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2 mt-2 first:mt-0">
                {entry.date}
              </p>
            )}
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta.color }}
                title={meta.label}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-gray-900 dark:text-white text-base">
                    {entry.systolic}/{entry.diastolic}
                  </span>
                  <span className="text-xs text-gray-400">mmHg</span>
                  {entry.pulse && (
                    <span className="text-xs text-gray-500">{entry.pulse} bpm</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-xs text-gray-400">{entry.time} Uhr</span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-gray-400 italic mt-0.5 truncate">{entry.notes}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(entry)} className="p-2 text-gray-400 hover:text-primary-500 transition-colors">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => onDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
