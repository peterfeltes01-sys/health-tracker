import { create } from 'zustand'
import type { TrainingProgressionSuggestion, ProgressionDecision, DeloadSuggestion, ReadinessCheckin } from '../../../types/training'
import type { WorkoutSession } from '../../../types/workout'
import type { MovementFamily } from '../../../types/training'
import { evaluateProgression, countConsecutiveDismissals } from '../../../utils/training/progression'
import { detectDeload } from '../../../utils/training/deload'
import { getProgressionDecisionRepository } from '../../../lib/progressionDecisionRepositoryRegistry'
import { EXERCISES } from '../../../data/exercises'

interface ProgressionState {
  suggestions: TrainingProgressionSuggestion[]
  deloadSuggestion: DeloadSuggestion | null
  decisions: ProgressionDecision[]
  conservativeExerciseIds: Set<string>
  lastDeloadSuggestedAt: number | undefined
  loading: boolean

  load(
    history: WorkoutSession[],
    families: MovementFamily[],
    readinessHistory: ReadinessCheckin[]
  ): Promise<void>

  acceptSuggestion(suggestion: TrainingProgressionSuggestion): Promise<void>
  dismissSuggestion(suggestion: TrainingProgressionSuggestion): Promise<void>
  dismissDeload(): void

  reset(): void
}

function rebuildSuggestions(
  history: WorkoutSession[],
  families: MovementFamily[],
  decisions: ProgressionDecision[],
  conservativeIds: Set<string>
): TrainingProgressionSuggestion[] {
  const exerciseIds = new Set<string>()
  for (const s of history) {
    for (const ls of s.loggedSets ?? []) {
      if (!ls.isWarmup) exerciseIds.add(ls.exerciseId)
    }
  }

  const results: TrainingProgressionSuggestion[] = []
  for (const id of exerciseIds) {
    const family = families.find((f) => f.levels.includes(id)) ?? null
    const exercise = EXERCISES.find((e) => e.id === id)
    const name = exercise?.name ?? id

    const suggestion = evaluateProgression(id, name, history, family, decisions)
    if (suggestion) results.push(suggestion)
  }
  return results
}

export const useProgressionStore = create<ProgressionState>((set, get) => ({
  suggestions: [],
  deloadSuggestion: null,
  decisions: [],
  conservativeExerciseIds: new Set(),
  lastDeloadSuggestedAt: undefined,
  loading: false,

  load: async (history, families, readinessHistory) => {
    set({ loading: true })
    try {
      const repo = getProgressionDecisionRepository()
      const decisions = await repo.getDecisions()

      // Determine conservative mode per exercise (>= 3 consecutive dismissals)
      const exerciseIds = new Set<string>()
      for (const d of decisions) exerciseIds.add(d.exerciseId)
      const conservativeIds = new Set<string>()
      for (const id of exerciseIds) {
        if (countConsecutiveDismissals(decisions, id) >= 3) conservativeIds.add(id)
      }

      const suggestions = rebuildSuggestions(history, families, decisions, conservativeIds)

      const { lastDeloadSuggestedAt } = get()
      const deload = detectDeload(history, readinessHistory, lastDeloadSuggestedAt)

      set({
        decisions,
        conservativeExerciseIds: conservativeIds,
        suggestions,
        deloadSuggestion: deload,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  acceptSuggestion: async (suggestion) => {
    const repo = getProgressionDecisionRepository()
    const decision: Omit<ProgressionDecision, 'id'> = {
      suggestionId: suggestion.id,
      exerciseId: suggestion.exerciseId,
      action: 'accepted',
      timestamp: Date.now(),
    }
    await repo.addDecision(decision)

    set((s) => ({
      decisions: [...s.decisions, { ...decision, id: suggestion.id }],
      suggestions: s.suggestions.filter((sg) => sg.id !== suggestion.id),
    }))
  },

  dismissSuggestion: async (suggestion) => {
    const repo = getProgressionDecisionRepository()
    const decision: Omit<ProgressionDecision, 'id'> = {
      suggestionId: suggestion.id,
      exerciseId: suggestion.exerciseId,
      action: 'dismissed',
      timestamp: Date.now(),
    }
    await repo.addDecision(decision)

    set((s) => {
      const newDecisions = [...s.decisions, { ...decision, id: suggestion.id }]
      const dismissals = countConsecutiveDismissals(newDecisions, suggestion.exerciseId)
      const newConservative = new Set(s.conservativeExerciseIds)
      if (dismissals >= 3) newConservative.add(suggestion.exerciseId)
      return {
        decisions: newDecisions,
        conservativeExerciseIds: newConservative,
        suggestions: s.suggestions.filter((sg) => sg.id !== suggestion.id),
      }
    })
  },

  dismissDeload: () => {
    set({ deloadSuggestion: null })
  },

  reset: () =>
    set({
      suggestions: [],
      deloadSuggestion: null,
      decisions: [],
      conservativeExerciseIds: new Set(),
      lastDeloadSuggestedAt: undefined,
      loading: false,
    }),
}))
