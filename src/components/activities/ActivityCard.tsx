import { useState } from 'react'
import { Pencil, Trash2, Clock, Flame, MapPin, Zap, Gauge, MountainSnow } from 'lucide-react'
import type { Activity } from '../../types'
import { ACTIVITIES, BIKE_TYPES, PACE_ACTIVITIES } from '../../utils/constants'
import { formatDuration, formatDistance, formatCalories, calcAvgSpeed, formatSpeed, calcPace, formatPace, formatElevation } from '../../utils/formatters'
import { useSettingsStore } from '../../stores/settingsStore'

interface ActivityCardProps {
  activity: Activity
  onEdit: (a: Activity) => void
  onDelete: (id: string) => void
  showDate?: boolean
}

const intensityLabel = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' }
const intensityColor = {
  low: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400',
  high: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
}

export function ActivityCard({ activity, onEdit, onDelete, showDate }: ActivityCardProps) {
  const [confirm, setConfirm] = useState(false)
  const customActivities = useSettingsStore((s) => s.settings.customActivities)
  const def = [...ACTIVITIES, ...customActivities].find((a) => a.id === activity.activityType)

  const name = activity.customName || def?.label || activity.activityType
  const icon = def?.icon ?? '⚡'

  const avgSpeed = activity.distanceKm && activity.durationMinutes > 0
    ? calcAvgSpeed(activity.distanceKm, activity.durationMinutes)
    : null

  const pace = PACE_ACTIVITIES.includes(activity.activityType) && activity.distanceKm && activity.durationMinutes > 0
    ? calcPace(activity.durationMinutes, activity.distanceKm)
    : null

  const bikeTypeLabel = BIKE_TYPES.find((b) => b.value === activity.bikeType)?.label

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-xl flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white">{name}</span>
              {bikeTypeLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-medium">
                  {bikeTypeLabel}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intensityColor[activity.intensity]}`}>
                {intensityLabel[activity.intensity]}
              </span>
            </div>
            {showDate && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {activity.date}{activity.startTime ? ` · ${activity.startTime}` : ''}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Clock size={14} />
                {formatDuration(activity.durationMinutes)}
              </span>
              {activity.distanceKm && (
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={14} />
                  {formatDistance(activity.distanceKm)}
                </span>
              )}
              {activity.elevationGain && (
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MountainSnow size={14} />
                  {formatElevation(activity.elevationGain)}
                </span>
              )}
              {avgSpeed !== null && activity.activityType === 'bike_outdoor' && (
                <span className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                  <Gauge size={14} />
                  {formatSpeed(avgSpeed)}
                </span>
              )}
              {pace !== null && (
                <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                  <Gauge size={14} />
                  {formatPace(pace)}
                </span>
              )}
              {activity.wattage && (
                <span className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                  <Zap size={14} />
                  {activity.wattage} W
                </span>
              )}
              {activity.calories && (
                <span className="flex items-center gap-1 text-sm text-accent-600 dark:text-accent-400">
                  <Flame size={14} />
                  {formatCalories(activity.calories)}
                  {activity.caloriesEstimated && <span className="text-gray-400 text-xs">(gesch.)</span>}
                </span>
              )}
            </div>
            {activity.notes && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">{activity.notes}</p>
            )}
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(activity)}
            className="p-2 rounded-xl text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/50 transition-colors"
          >
            <Pencil size={16} />
          </button>
          {confirm ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(activity.id)}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors text-xs font-medium"
              >
                Löschen
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirm(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
