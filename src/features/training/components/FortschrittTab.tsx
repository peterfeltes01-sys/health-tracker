import { useMemo } from 'react'
import type { WorkoutSession } from '../../../types/workout'
import type { MovementFamily } from '../../../types/training'
import { computeStrengthProfile } from '../../../utils/training/analytics'
import { getAllPRs } from '../../../utils/training/pr'
import { StrengthProfileRadar } from './StrengthProfileRadar'
import { PrTimeline } from './PrTimeline'
import { SessionQualitySparkline } from './SessionQualitySparkline'
import { ProgressionSuggestionCard } from './ProgressionSuggestionCard'
import { DeloadSuggestionCard } from './DeloadSuggestionCard'
import { useProgressionStore } from '../store/progressionSlice'
import { EXERCISES } from '../../../data/exercises'

interface FortschrittTabProps {
  sessions: WorkoutSession[]
  families: MovementFamily[]
}

export function FortschrittTab({ sessions, families }: FortschrittTabProps) {
  const { suggestions, deloadSuggestion, acceptSuggestion, dismissSuggestion, dismissDeload } =
    useProgressionStore()

  const profile = useMemo(
    () => computeStrengthProfile(sessions, families),
    [sessions, families]
  )

  const prs = useMemo(() => getAllPRs(sessions), [sessions])

  function resolveExerciseName(id?: string): string | undefined {
    if (!id) return undefined
    return EXERCISES.find((e) => e.id === id)?.name
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Progression suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Progressionsvorschläge
          </h2>
          <div className="space-y-3">
            {suggestions.map((sg) => (
              <ProgressionSuggestionCard
                key={sg.id}
                suggestion={sg}
                toExerciseName={resolveExerciseName(sg.toExerciseId)}
                onAccept={() => acceptSuggestion(sg)}
                onDismiss={() => dismissSuggestion(sg)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Deload suggestion */}
      {deloadSuggestion && (
        <DeloadSuggestionCard
          suggestion={deloadSuggestion}
          onAccept={() => {
            dismissDeload()
            // Caller handles deload session creation
          }}
          onDismiss={dismissDeload}
        />
      )}

      {/* Session quality */}
      {sessions.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Session-Qualität
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <SessionQualitySparkline sessions={sessions} />
          </div>
        </section>
      )}

      {/* Strength profile */}
      {(profile.exercises.length > 0 || profile.radarData.length > 0) && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Stärke-Profil
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <StrengthProfileRadar profile={profile} />
          </div>
        </section>
      )}

      {/* PR timeline */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Persönliche Rekorde
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <PrTimeline prs={prs} />
        </div>
      </section>
    </div>
  )
}
