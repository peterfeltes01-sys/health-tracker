import type { Exercise, ExerciseMediaOverride, CustomExercise } from '../../types/workout'

export function resolveExerciseMedia(
  exercise: Exercise,
  override?: ExerciseMediaOverride
): string[] {
  if (!override || override.customMedia.length === 0) return exercise.mediaUrls
  const customUrls = override.customMedia.map((m) => m.url)
  if (override.strategy === 'replace') return customUrls
  return [...exercise.mediaUrls, ...customUrls]
}

export function customExerciseToExercise(ce: CustomExercise): Exercise {
  return {
    id: ce.id,
    name: ce.name,
    modes: ce.modes,
    primaryMuscles: ce.primaryMuscles,
    secondaryMuscles: ce.secondaryMuscles,
    difficulty: ce.difficulty,
    target: ce.target,
    basePoints: ce.basePoints,
    mediaUrls: ce.media.map((m) => m.url),
    instructions: ce.instructions,
    chairVariantNote: ce.chairVariantNote,
  }
}
