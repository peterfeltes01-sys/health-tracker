import { useEffect, useRef } from 'react'
import { SkipForward, Plus, Minus, Pause, Play } from 'lucide-react'
import { useWorkoutStore } from '../../stores/workoutStore'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // AudioContext not available
  }
}

export function RestTimerOverlay() {
  const { restTimer, tickRest, addRestTime, pauseRest, resumeRest, skipRest } = useWorkoutStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const visibilityTimestampRef = useRef<number | null>(null)

  const { isRunning, isPaused, secondsRemaining, activeExerciseId } = restTimer

  // Background/foreground handling
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        visibilityTimestampRef.current = Date.now()
      } else if (visibilityTimestampRef.current !== null && isRunning && !isPaused) {
        const elapsed = Math.floor((Date.now() - visibilityTimestampRef.current) / 1000)
        if (elapsed > 0) addRestTime(-elapsed)
        visibilityTimestampRef.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRunning, isPaused, addRestTime])

  // Interval tick
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => tickRest(), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isPaused, tickRest])

  // Completion effects
  const prevRemaining = useRef(secondsRemaining)
  useEffect(() => {
    if (prevRemaining.current > 0 && secondsRemaining === 0 && activeExerciseId) {
      playBeep()
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
    prevRemaining.current = secondsRemaining
  }, [secondsRemaining, activeExerciseId])

  if (!activeExerciseId) return null

  const pct = restTimer.totalSeconds > 0 ? secondsRemaining / restTimer.totalSeconds : 0
  const circumference = 2 * Math.PI * 38
  const strokeDash = circumference * pct

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 safe-bottom">
      <div className="mx-4 mb-24 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke="currentColor" strokeWidth="6"
                className="text-gray-100 dark:text-gray-800" />
              <circle
                cx="44" cy="44" r="38" fill="none"
                stroke="currentColor" strokeWidth="6"
                className="text-primary-500 transition-all duration-1000"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - strokeDash}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                {formatTime(secondsRemaining)}
              </span>
            </div>
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Pause</p>
            <p className="text-xs text-gray-400">
              {secondsRemaining === 0 ? 'Bereit für den nächsten Satz!' : 'Erhole dich kurz…'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => addRestTime(-15)}
              className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform text-[10px] font-bold"
            >
              <Minus size={13} />
            </button>
            <button
              onClick={isPaused ? resumeRest : pauseRest}
              className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              onClick={() => addRestTime(15)}
              className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={skipRest}
              className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center text-white active:scale-95 transition-transform"
              title="Überspringen"
            >
              <SkipForward size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
