import { create } from 'zustand'
import type { ExerciseMediaSettings, CustomMediaItem } from '../types/routine'
import { getExerciseMediaRepository } from '../lib/exerciseMediaRepositoryRegistry'
import { getMediaUploader } from '../lib/mediaUploaderRegistry'
import { compressImage } from '../lib/mediaUploader'
import { generateId } from '../utils/calculations'
import { buildDefaultMediaId } from '../utils/workout/mediaUtils'

interface ExerciseMediaStoreState {
  overrides: Record<string, ExerciseMediaSettings>
  uid: string | null

  setUid(uid: string | null): void
  loadOverride(exerciseId: string): Promise<void>
  addCustomMedia(
    exerciseId: string,
    file: File,
    defaultUrls: string[],
    onProgress?: (pct: number) => void
  ): Promise<void>
  removeCustomMedia(exerciseId: string, item: CustomMediaItem): Promise<void>
  hideDefault(exerciseId: string, url: string, defaultUrls: string[]): Promise<void>
  restoreDefaults(exerciseId: string): Promise<void>
  setPrimary(exerciseId: string, mediaId: string): Promise<void>
  reset(): void
}

function emptySettings(exerciseId: string): ExerciseMediaSettings {
  return { exerciseId, hiddenDefaults: [], customMedia: [], primaryMediaId: null, updatedAt: Date.now() }
}

export const useExerciseMediaStore = create<ExerciseMediaStoreState>((set, get) => ({
  overrides: {},
  uid: null,

  setUid: (uid) => set({ uid }),

  loadOverride: async (exerciseId) => {
    const repo = getExerciseMediaRepository()
    const override = await repo.getOverride(exerciseId)
    if (override) {
      set((s) => ({ overrides: { ...s.overrides, [exerciseId]: override } }))
    }
  },

  addCustomMedia: async (exerciseId, file, defaultUrls, onProgress) => {
    const { uid, overrides } = get()
    if (!uid) throw new Error('MEDIA_UPLOAD_REQUIRES_LOGIN')

    const compressed = file.type.startsWith('image/') ? await compressImage(file, 1280) : file
    const ext = compressed.name.split('.').pop() ?? 'jpg'
    const mediaId = generateId()
    const storagePath = `users/${uid}/exerciseMedia/${exerciseId}/${mediaId}.${ext}`

    const uploader = getMediaUploader()
    const { url } = await uploader.uploadFile(compressed, storagePath, onProgress)

    const item: CustomMediaItem = { id: mediaId, url, storagePath, uploadedAt: Date.now() }
    const existing = overrides[exerciseId] ?? emptySettings(exerciseId)
    const updated: ExerciseMediaSettings = {
      ...existing,
      customMedia: [...existing.customMedia, item],
      updatedAt: Date.now(),
    }

    const prevDefaultIds = defaultUrls.map(buildDefaultMediaId)
    if (updated.primaryMediaId === null && prevDefaultIds.length === 0 && updated.customMedia.length === 1) {
      updated.primaryMediaId = mediaId
    }

    await getExerciseMediaRepository().upsertOverride(updated)
    set((s) => ({ overrides: { ...s.overrides, [exerciseId]: updated } }))
  },

  removeCustomMedia: async (exerciseId, item) => {
    const { overrides } = get()
    try {
      await getMediaUploader().deleteFile(item.storagePath)
    } catch {
      // already gone from Storage — still clean up DB
    }

    const existing = overrides[exerciseId] ?? emptySettings(exerciseId)
    const updated: ExerciseMediaSettings = {
      ...existing,
      customMedia: existing.customMedia.filter((m) => m.id !== item.id),
      primaryMediaId: existing.primaryMediaId === item.id ? null : existing.primaryMediaId,
      updatedAt: Date.now(),
    }

    if (updated.customMedia.length === 0 && updated.hiddenDefaults.length === 0 && updated.primaryMediaId === null) {
      await getExerciseMediaRepository().deleteOverride(exerciseId)
      set((s) => {
        const next = { ...s.overrides }
        delete next[exerciseId]
        return { overrides: next }
      })
    } else {
      await getExerciseMediaRepository().upsertOverride(updated)
      set((s) => ({ overrides: { ...s.overrides, [exerciseId]: updated } }))
    }
  },

  hideDefault: async (exerciseId, url, _defaultUrls) => {
    const { overrides } = get()
    const id = buildDefaultMediaId(url)
    const existing = overrides[exerciseId] ?? emptySettings(exerciseId)
    if (existing.hiddenDefaults.includes(id)) return

    const updated: ExerciseMediaSettings = {
      ...existing,
      hiddenDefaults: [...existing.hiddenDefaults, id],
      primaryMediaId: existing.primaryMediaId === id ? null : existing.primaryMediaId,
      updatedAt: Date.now(),
    }

    await getExerciseMediaRepository().upsertOverride(updated)
    set((s) => ({ overrides: { ...s.overrides, [exerciseId]: updated } }))
  },

  restoreDefaults: async (exerciseId) => {
    const { overrides } = get()
    const existing = overrides[exerciseId]
    if (!existing || existing.hiddenDefaults.length === 0) return

    const updated: ExerciseMediaSettings = {
      ...existing,
      hiddenDefaults: [],
      updatedAt: Date.now(),
    }

    await getExerciseMediaRepository().upsertOverride(updated)
    set((s) => ({ overrides: { ...s.overrides, [exerciseId]: updated } }))
  },

  setPrimary: async (exerciseId, mediaId) => {
    const { overrides } = get()
    const existing = overrides[exerciseId] ?? emptySettings(exerciseId)
    const updated: ExerciseMediaSettings = {
      ...existing,
      primaryMediaId: mediaId,
      updatedAt: Date.now(),
    }

    await getExerciseMediaRepository().upsertOverride(updated)
    set((s) => ({ overrides: { ...s.overrides, [exerciseId]: updated } }))
  },

  reset: () => set({ overrides: {}, uid: null }),
}))
