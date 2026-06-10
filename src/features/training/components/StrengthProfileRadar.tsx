import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { StrengthProfile } from '../../../types/training'
import { TRAINING_MUSCLE_LABELS } from '../../../types/training'

interface StrengthProfileRadarProps {
  profile: StrengthProfile
}

const TREND_ICONS = {
  up: TrendingUp,
  flat: Minus,
  down: TrendingDown,
}

const TREND_COLORS = {
  up: 'text-green-500',
  flat: 'text-gray-400',
  down: 'text-red-500',
}

export function StrengthProfileRadar({ profile }: StrengthProfileRadarProps) {
  const radarData = profile.radarData.map((d) => ({
    subject: TRAINING_MUSCLE_LABELS[d.muscle] ?? d.muscle,
    score: d.score,
    fullMark: 100,
  }))

  return (
    <div className="space-y-5">
      {radarData.length >= 3 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Muskelgruppen-Profil</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <Radar
                name="Stärke"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {profile.exercises.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Übungen</h3>
          <div className="space-y-2">
            {profile.exercises.map((ex) => {
              const TrendIcon = TREND_ICONS[ex.trend]
              return (
                <div
                  key={ex.exerciseId}
                  className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {ex.exerciseName}
                    </p>
                    <p className="text-xs text-gray-400">Stufe {ex.currentLevel}</p>
                  </div>

                  {/* Mini sparkline */}
                  {ex.recentReps.length > 1 && (
                    <div className="flex items-end gap-0.5 h-6">
                      {ex.recentReps.slice(-6).map((reps, i) => {
                        const max = Math.max(...ex.recentReps)
                        const h = max > 0 ? Math.round((reps / max) * 24) : 4
                        return (
                          <div
                            key={i}
                            className="w-1.5 bg-primary-400 dark:bg-primary-600 rounded-sm"
                            style={{ height: `${Math.max(4, h)}px` }}
                          />
                        )
                      })}
                    </div>
                  )}

                  <TrendIcon size={16} className={TREND_COLORS[ex.trend]} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
