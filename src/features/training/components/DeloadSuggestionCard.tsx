import { BatteryLow, X } from 'lucide-react'
import type { DeloadSuggestion } from '../../../types/training'

interface DeloadSuggestionCardProps {
  suggestion: DeloadSuggestion
  onAccept: () => void
  onDismiss: () => void
}

export function DeloadSuggestionCard({ suggestion, onAccept, onDismiss }: DeloadSuggestionCardProps) {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
          <BatteryLow size={18} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
              Deload-Woche vorgeschlagen
            </p>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2 leading-relaxed">
            {suggestion.reason}
          </p>
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1.5">
            −40 % Volumen · gleiche Übungen · volle Punkte
          </p>
        </div>
      </div>

      <button
        onClick={onAccept}
        className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 shadow-sm shadow-indigo-600/30 active:scale-95 transition-transform"
      >
        Deload-Woche starten
      </button>
    </div>
  )
}
