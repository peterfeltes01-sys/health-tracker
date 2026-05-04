import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { useNotesStore } from '../../stores/notesStore'
import type { NoteBoard } from '../../types'
import { toISODate } from '../../utils/calculations'

const shownThisSession = new Set<string>()

export function ReminderModal() {
  const { boards, updateBoard } = useNotesStore()
  const navigate = useNavigate()
  const [dueBoards, setDueBoards] = useState<NoteBoard[]>([])

  useEffect(() => {
    const now = new Date()
    const todayStr = toISODate(now)
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const due = boards.filter((b) => {
      if (!b.reminderDate) return false
      if (shownThisSession.has(b.id)) return false
      if (b.reminderDate > todayStr) return false
      if (b.reminderDate === todayStr && b.reminderTime && b.reminderTime > nowTime) return false
      return true
    })

    due.forEach((b) => shownThisSession.add(b.id))
    if (due.length > 0) setDueBoards(due)
  }, [boards])

  function dismiss() {
    setDueBoards([])
  }

  async function dismissAndClear() {
    for (const board of dueBoards) {
      await updateBoard({ ...board, reminderDate: undefined, reminderTime: undefined })
    }
    setDueBoards([])
  }

  return (
    <Modal open={dueBoards.length > 0} onClose={dismiss} title="Erinnerung">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-500">
          <Bell size={18} />
          <p className="text-sm font-medium">
            {dueBoards.length === 1 ? 'Eine Erinnerung ist fällig' : `${dueBoards.length} Erinnerungen sind fällig`}
          </p>
        </div>

        <div className="space-y-2">
          {dueBoards.map((board) => {
            const checked = board.items.filter((i) => i.checked).length
            const total = board.items.length
            return (
              <div key={board.id} className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{board.title}</p>
                {board.reminderDate && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    {board.reminderDate}{board.reminderTime ? ` · ${board.reminderTime} Uhr` : ''}
                  </p>
                )}
                {total > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{checked} / {total} erledigt</p>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button fullWidth onClick={() => { dismiss(); navigate('/notes') }}>
            Zu den Notizen
          </Button>
          <Button fullWidth variant="ghost" onClick={dismissAndClear}>
            Erinnerung löschen
          </Button>
          <Button fullWidth variant="ghost" onClick={dismiss}>
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
