import { useState } from 'react'
import { ChevronRight, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Habit, HabitEntry } from '../../types/habits'
import { isEntryFulfilled } from '../../lib/habitStats'
import { useHabitStore } from '../../stores/habitStore'

interface HabitCardProps {
  habit: Habit
  entry: HabitEntry | null
  date: string
}

export function HabitCard({ habit, entry, date }: HabitCardProps) {
  const navigate = useNavigate()
  const { toggleEntry, setEntryValue, setEntryNote } = useHabitStore()
  const [valueInput, setValueInput] = useState(entry?.value?.toString() ?? '')
  const [showInput, setShowInput] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [noteInput, setNoteInput] = useState(entry?.note ?? '')

  const fulfilled = entry ? isEntryFulfilled(entry, habit) : false
  const progress =
    habit.type === 'quantified' && habit.targetValue && habit.targetValue > 0
      ? Math.min(100, ((entry?.value ?? 0) / habit.targetValue) * 100)
      : null

  async function handleToggleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (habit.type === 'binary') {
      await toggleEntry(habit, date)
    } else {
      setShowInput((v) => !v)
    }
  }

  async function handleValueSubmit() {
    const n = parseFloat(valueInput)
    if (!isNaN(n) && n >= 0) {
      await setEntryValue(habit, date, n)
      setShowInput(false)
    }
  }

  async function handleNoteSave() {
    if (entry) {
      await setEntryNote(habit.id, date, noteInput)
    }
    setShowNote(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
        onClick={() => navigate(`/habits/${habit.id}`)}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: habit.color + '20' }}
        >
          {habit.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate transition-all ${
              fulfilled
                ? 'text-gray-400 dark:text-gray-500 line-through'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {habit.name}
          </p>
          {habit.type === 'quantified' && habit.targetValue !== null && (
            <p className="text-xs text-gray-400 tabular-nums">
              {entry?.value ?? 0} / {habit.targetValue} {habit.targetUnit}
            </p>
          )}
          {progress !== null && (
            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: habit.color }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {entry && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNote((v) => !v) }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500"
            >
              <MessageSquare size={13} />
            </button>
          )}
          <button
            onClick={handleToggleClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              fulfilled ? '' : 'border-2 border-gray-200 dark:border-gray-700'
            }`}
            style={fulfilled ? { backgroundColor: habit.color } : undefined}
          >
            {fulfilled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : habit.type === 'quantified' ? (
              <span className="text-xs font-bold text-gray-400">+</span>
            ) : null}
          </button>
          <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
        </div>
      </div>

      {/* Quantified value input */}
      {showInput && (
        <div
          className="flex gap-2 px-3 pb-3 border-t border-gray-50 dark:border-gray-800 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="number"
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValueSubmit()}
            placeholder={`Menge${habit.targetUnit ? ` in ${habit.targetUnit}` : ''}`}
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <button
            onClick={handleValueSubmit}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
            style={{ backgroundColor: habit.color }}
          >
            OK
          </button>
        </div>
      )}

      {/* Note input */}
      {showNote && (
        <div
          className="flex gap-2 px-3 pb-3 border-t border-gray-50 dark:border-gray-800 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNoteSave()}
            placeholder="Notiz hinzufügen…"
            className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <button
            onClick={handleNoteSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gray-500 active:scale-95"
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}
