import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Bell, Check } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Modal } from '../components/shared/Modal'
import { Input } from '../components/shared/Input'
import { Button } from '../components/shared/Button'
import { useNotesStore } from '../stores/notesStore'
import type { NoteBoard } from '../types'

export function NotesPage() {
  const { boards, loading, load, addBoard, updateBoard, deleteBoard, toggleItem, addItem, deleteItem } = useNotesStore()

  const [showBoardModal, setShowBoardModal] = useState(false)
  const [editBoard, setEditBoard] = useState<NoteBoard | null>(null)
  const [boardTitle, setBoardTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [])

  function openCreateModal() {
    setEditBoard(null)
    setBoardTitle('')
    setReminderDate('')
    setReminderTime('')
    setShowBoardModal(true)
  }

  function openEditModal(board: NoteBoard) {
    setEditBoard(board)
    setBoardTitle(board.title)
    setReminderDate(board.reminderDate ?? '')
    setReminderTime(board.reminderTime ?? '')
    setShowBoardModal(true)
  }

  async function handleSaveBoard() {
    if (!boardTitle.trim()) return
    const rd = reminderDate || undefined
    const rt = rd && reminderTime ? reminderTime : undefined
    if (editBoard) {
      await updateBoard({ ...editBoard, title: boardTitle.trim(), reminderDate: rd, reminderTime: rt })
    } else {
      await addBoard(boardTitle.trim(), rd, rt)
    }
    setShowBoardModal(false)
  }

  async function handleAddItem(boardId: string) {
    const text = (newItemTexts[boardId] ?? '').trim()
    if (!text) return
    await addItem(boardId, text)
    setNewItemTexts((prev) => ({ ...prev, [boardId]: '' }))
  }

  return (
    <>
      <Header title="Notizen" />
      <PageWrapper>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">
            {boards.length === 0 ? 'Keine Boards' : `${boards.length} Board${boards.length !== 1 ? 's' : ''}`}
          </p>
          <Button size="sm" onClick={openCreateModal}>
            <Plus size={14} /> Board erstellen
          </Button>
        </div>

        {!loading && boards.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Noch keine Boards</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Erstelle ein Board mit Checkliste und optionaler Erinnerung
            </p>
          </div>
        )}

        <div className="space-y-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              newItemText={newItemTexts[board.id] ?? ''}
              onNewItemTextChange={(text) => setNewItemTexts((prev) => ({ ...prev, [board.id]: text }))}
              onAddItem={() => handleAddItem(board.id)}
              onToggleItem={(itemId) => toggleItem(board.id, itemId)}
              onDeleteItem={(itemId) => deleteItem(board.id, itemId)}
              onEdit={() => openEditModal(board)}
              onDelete={() => deleteBoard(board.id)}
            />
          ))}
        </div>
      </PageWrapper>

      <Modal
        open={showBoardModal}
        onClose={() => setShowBoardModal(false)}
        title={editBoard ? 'Board bearbeiten' : 'Neues Board'}
      >
        <div className="space-y-4">
          <Input
            label="Board-Titel"
            placeholder="z.B. Einkaufsliste"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSaveBoard()}
          />

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              🔔 Erinnerung (optional)
            </p>
            <Input
              type="date"
              label="Datum"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
            {reminderDate && (
              <div className="mt-2 space-y-2">
                <Input
                  type="time"
                  label="Uhrzeit (optional)"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
                <button
                  onClick={() => { setReminderDate(''); setReminderTime('') }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Erinnerung entfernen
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button fullWidth variant="secondary" onClick={() => setShowBoardModal(false)}>
              Abbrechen
            </Button>
            <Button fullWidth onClick={handleSaveBoard} disabled={!boardTitle.trim()}>
              {editBoard ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function BoardCard({
  board,
  newItemText,
  onNewItemTextChange,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onEdit,
  onDelete,
}: {
  board: NoteBoard
  newItemText: string
  onNewItemTextChange: (text: string) => void
  onAddItem: () => void
  onToggleItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const checked = board.items.filter((i) => i.checked).length
  const total = board.items.length

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-800/60">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{board.title}</h3>
          {board.reminderDate && (
            <div className="flex items-center gap-1 mt-0.5">
              <Bell size={10} className="text-amber-500 flex-shrink-0" />
              <span className="text-[10px] text-amber-500 font-medium">
                {board.reminderDate}{board.reminderTime ? ` · ${board.reminderTime} Uhr` : ''}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {total > 0 && (
            <span className="text-xs text-gray-400 tabular-nums mr-1">{checked}/{total}</span>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-2">
        {board.items.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-600 py-1">Noch keine Einträge</p>
        )}
        <div className="space-y-0.5">
          {board.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-1.5 group">
              <button
                onClick={() => onToggleItem(item.id)}
                className={`w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                  item.checked
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                }`}
              >
                {item.checked && <Check size={11} className="text-white" />}
              </button>
              <span
                className={`flex-1 text-sm leading-snug ${
                  item.checked
                    ? 'line-through text-gray-400 dark:text-gray-600'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add item */}
      <div className="px-4 pb-3 pt-1 flex gap-2">
        <Input
          placeholder="Neuer Eintrag…"
          value={newItemText}
          onChange={(e) => onNewItemTextChange(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onAddItem()}
          className="flex-1"
        />
        <Button size="sm" onClick={onAddItem} disabled={!newItemText.trim()}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}
