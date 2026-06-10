import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Trophy } from 'lucide-react'
import type { PRResult } from '../../../types/training'

interface PrTimelineProps {
  prs: PRResult[]
}

export function PrTimeline({ prs }: PrTimelineProps) {
  if (prs.length === 0) {
    return (
      <div className="py-8 text-center">
        <Trophy size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Noch keine persönlichen Rekorde</p>
        <p className="text-xs text-gray-400 mt-1">Trainiere regelmäßig, um PRs zu setzen!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {prs.map((pr, i) => (
        <div
          key={`${pr.exerciseId}-${pr.date}-${i}`}
          className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-3 py-3 border border-gray-100 dark:border-gray-800"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <Trophy size={16} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {pr.exerciseName}
            </p>
            <p className="text-xs text-gray-400">
              Stufe {pr.variationLevel} · {format(new Date(pr.date), 'd. MMM yyyy', { locale: de })}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-black text-primary-500">{pr.reps}</span>
            <span className="text-xs text-gray-400 ml-1">Wdh.</span>
          </div>
        </div>
      ))}
    </div>
  )
}
