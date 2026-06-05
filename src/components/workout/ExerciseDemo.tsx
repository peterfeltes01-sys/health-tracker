import { useState } from 'react'
import type { Exercise } from '../../types/workout'

const MUSCLE_COLORS: Record<string, string> = {
  brust: 'from-rose-400 to-pink-500',
  ruecken: 'from-blue-400 to-indigo-500',
  schultern: 'from-orange-400 to-amber-500',
  arme: 'from-purple-400 to-violet-500',
  beine: 'from-emerald-400 to-teal-500',
  gesaess: 'from-lime-400 to-green-500',
  rumpf: 'from-yellow-400 to-orange-500',
  ganzkoerper: 'from-cyan-400 to-sky-500',
}

function HumanFigure({ muscle }: { muscle: string }) {
  const color = muscle === 'brust' ? '#f43f5e'
    : muscle === 'ruecken' ? '#6366f1'
    : muscle === 'schultern' ? '#f97316'
    : muscle === 'arme' ? '#a855f7'
    : muscle === 'beine' ? '#10b981'
    : muscle === 'gesaess' ? '#84cc16'
    : muscle === 'rumpf' ? '#eab308'
    : '#06b6d4'

  return (
    <svg viewBox="0 0 100 200" className="h-full w-auto mx-auto drop-shadow-lg" aria-hidden>
      {/* Head */}
      <circle cx="50" cy="20" r="14" fill={color} opacity="0.9" />
      {/* Neck */}
      <rect x="45" y="33" width="10" height="8" rx="3" fill={color} opacity="0.8" />
      {/* Torso */}
      <rect x="30" y="41" width="40" height="50" rx="8" fill={color} opacity="0.85" />
      {/* Left arm */}
      <rect x="14" y="43" width="14" height="42" rx="7" fill={color} opacity="0.75" />
      <rect x="10" y="82" width="12" height="24" rx="6" fill={color} opacity="0.65" />
      {/* Right arm */}
      <rect x="72" y="43" width="14" height="42" rx="7" fill={color} opacity="0.75" />
      <rect x="78" y="82" width="12" height="24" rx="6" fill={color} opacity="0.65" />
      {/* Left leg */}
      <rect x="31" y="91" width="16" height="55" rx="8" fill={color} opacity="0.8" />
      <rect x="29" y="143" width="14" height="32" rx="7" fill={color} opacity="0.7" />
      {/* Right leg */}
      <rect x="53" y="91" width="16" height="55" rx="8" fill={color} opacity="0.8" />
      <rect x="55" y="143" width="14" height="32" rx="7" fill={color} opacity="0.7" />
      {/* Feet */}
      <ellipse cx="36" cy="177" rx="11" ry="6" fill={color} opacity="0.6" />
      <ellipse cx="62" cy="177" rx="11" ry="6" fill={color} opacity="0.6" />
    </svg>
  )
}

interface ExerciseDemoProps {
  exercise: Exercise
  resolvedUrls?: string[]
  className?: string
}

export function ExerciseDemo({ exercise, resolvedUrls, className = '' }: ExerciseDemoProps) {
  const [imgIndex, setImgIndex] = useState(0)
  const [imgError, setImgError] = useState(false)

  const primaryMuscle = exercise.primaryMuscles[0] ?? 'ganzkoerper'
  const gradient = MUSCLE_COLORS[primaryMuscle] ?? MUSCLE_COLORS.ganzkoerper

  const urls = resolvedUrls ?? exercise.mediaUrls
  const hasImage = urls.length > 0 && !imgError
  const imgUrl = urls[imgIndex] ?? urls[0]

  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />

      {hasImage ? (
        <div className="relative h-full w-full">
          {imgUrl.endsWith('.mp4') || imgUrl.includes('video') ? (
            <video
              key={imgUrl}
              src={imgUrl}
              className="h-full w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              key={imgUrl}
              src={imgUrl}
              alt={exercise.name}
              className="h-full w-full object-contain object-center"
              onError={() => {
                if (imgIndex < urls.length - 1) {
                  setImgIndex(imgIndex + 1)
                } else {
                  setImgError(true)
                }
              }}
            />
          )}
          {urls.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br ${gradient} bg-opacity-10`}>
          <div className="h-48 w-32 relative">
            <HumanFigure muscle={primaryMuscle} />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center px-4">
            {exercise.name}
          </p>
        </div>
      )}
    </div>
  )
}
