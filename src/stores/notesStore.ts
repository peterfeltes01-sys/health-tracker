import { create } from 'zustand'
import { getRepository } from '../lib/repositoryRegistry'
import type { NoteBoard, NoteItem } from '../types'
import { generateId } from '../utils/calculations'

interface NotesState {
  boards: NoteBoard[]
  loading: boolean
  load: () => Promise<void>
  addBoard: (title: string, reminderDate?: string, reminderTime?: string) => Promise<void>
  updateBoard: (board: NoteBoard) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
  toggleItem: (boardId: string, itemId: string) => Promise<void>
  addItem: (boardId: string, text: string) => Promise<void>
  deleteItem: (boardId: string, itemId: string) => Promise<void>
  reset: () => void
}

export const useNotesStore = create<NotesState>((set, get) => ({
  boards: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const boards = await getRepository().getNoteBoards()
    set({ boards, loading: false })
  },

  addBoard: async (title, reminderDate, reminderTime) => {
    const now = new Date().toISOString()
    const board: Omit<NoteBoard, 'id'> = {
      title,
      items: [],
      reminderDate,
      reminderTime,
      createdAt: now,
      updatedAt: now,
    }
    const id = await getRepository().addNoteBoard(board)
    set({ boards: [...get().boards, { ...board, id }] })
  },

  updateBoard: async (board) => {
    const updated = { ...board, updatedAt: new Date().toISOString() }
    await getRepository().updateNoteBoard(updated)
    set({ boards: get().boards.map((b) => (b.id === board.id ? updated : b)) })
  },

  deleteBoard: async (id) => {
    await getRepository().deleteNoteBoard(id)
    set({ boards: get().boards.filter((b) => b.id !== id) })
  },

  toggleItem: async (boardId, itemId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const updated: NoteBoard = {
      ...board,
      items: board.items.map((item): NoteItem =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
      updatedAt: new Date().toISOString(),
    }
    await getRepository().updateNoteBoard(updated)
    set({ boards: get().boards.map((b) => (b.id === boardId ? updated : b)) })
  },

  addItem: async (boardId, text) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const newItem: NoteItem = { id: generateId(), text, checked: false }
    const updated: NoteBoard = {
      ...board,
      items: [...board.items, newItem],
      updatedAt: new Date().toISOString(),
    }
    await getRepository().updateNoteBoard(updated)
    set({ boards: get().boards.map((b) => (b.id === boardId ? updated : b)) })
  },

  deleteItem: async (boardId, itemId) => {
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return
    const updated: NoteBoard = {
      ...board,
      items: board.items.filter((item) => item.id !== itemId),
      updatedAt: new Date().toISOString(),
    }
    await getRepository().updateNoteBoard(updated)
    set({ boards: get().boards.map((b) => (b.id === boardId ? updated : b)) })
  },

  reset: () => set({ boards: [], loading: false }),
}))
