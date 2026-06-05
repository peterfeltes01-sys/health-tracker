import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronRight, ChevronLeft, Check, Plus, Minus, X } from 'lucide-react'
import type { Exercise, PerformedExercise } from '../../types/workout'
import { exercisePoints } from '../../utils/workout/scoring'
import { ExerciseDemo } from './ExerciseDemo'

const MUSCLE_LABELS: Record<string, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  schultern: 'Schultern',
  arme: 'Arme',
  beine: 'Beine',
  gesaess: 'Gesäß',
  rumpf: 'Rumpf',
  ganzkoerper: 'Ganzkörper',
}

interface ExerciseResultToastProps {
  points: number
  bonus: number
  onDone: () => void
}

function ExerciseResultToast({ points, bonus, onDone }: ExerciseResultToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl px-10 py-8 text-center animate-bounce-once">
        <div className="text-5xl font-black text-primary-500 mb-1">+{points}</div>
        <div className="text-base text-gray-600 dark:text-gray-300 font-medium">Punkte</div>
        {bonus > 0 && (
          <div className="mt-2 text-sm font-semibold text-amber-500">Bonus +{bonus}!</div>
        )}
      </div>
    </div>
  )
}

interface TimerProps {
  seconds: number
  onComplete: () => void
}

function CountdownTimer({ seconds, onComplete }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onCompleteRef.current()
      return
    }
    const t = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(t)
  }, [remaining])

  const pct = (1 - remaining / seconds) * 100
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke="currentColor" strokeWidth="8"
            className="text-primary-500 transition-all duration-1000"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black text-gray-900 dark:text-white">{remaining}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Sekunden</p>
    </div>
  )
}

interface SessionPlayerProps {
  exercises: Exercise[]
  onFinish: (performed: PerformedExercise[]) => void
  onAbort: () => void
}

export function SessionPlayer({ exercises, onFinish, onAbort }: SessionPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [actualReps, setActualReps] = useState<number>(0)
  const [performed, setPerformed] = useState<PerformedExercise[]>([])
  const [showToast, setShowToast] = useState(false)
  const [lastResult, setLastResult] = useState<{ points: number; bonus: number } | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [setReps, setSetReps] = useState<number[]>([])

  const exercise = exercises[currentIndex]

  useEffect(() => {
    if (!exercise) return
    if (exercise.target.type === 'reps') {
      setActualReps(exercise.target.reps)
    }
    setCurrentSet(1)
    setSetReps([])
    setShowInstructions(false)
    setTimerKey((k) => k + 1)
  }, [currentIndex, exercise])

  const handleSetComplete = useCallback(() => {
    if (!exercise) return
    const reps = exercise.target.type === 'reps' ? actualReps : 0
    const newSetReps = [...setReps, reps]
    setSetReps(newSetReps)

    if (currentSet >= exercise.target.sets) {
      const totalActualReps = newSetReps.reduce((a, b) => a + b, 0)
      const actual =
        exercise.target.type === 'reps'
          ? { sets: exercise.target.sets, reps: Math.round(totalActualReps / exercise.target.sets) }
          : { sets: exercise.target.sets, seconds: exercise.target.seconds }

      const { points, metTarget } = exercisePoints(exercise, actual)
      const bonus = Math.max(0, points - exercise.basePoints)

      const p: PerformedExercise = {
        exerciseId: exercise.id,
        nameSnapshot: exercise.name,
        basePointsSnapshot: exercise.basePoints,
        targetSnapshot: exercise.target,
        actual,
        pointsEarned: points,
        metTarget,
      }

      setLastResult({ points, bonus })
      setShowToast(true)

      const updatedPerformed = [...performed, p]
      setPerformed(updatedPerformed)

      if (currentIndex + 1 >= exercises.length) {
        setTimeout(() => {
          setShowToast(false)
          onFinish(updatedPerformed)
        }, 2100)
      }
    } else {
      setCurrentSet((s) => s + 1)
      setTimerKey((k) => k + 1)
    }
  }, [exercise, currentSet, actualReps, setReps, performed, currentIndex, exercises.length, onFinish])

  if (!exercise) return null

  const isLast = currentIndex + 1 >= exercises.length
  const isLastSet = currentSet >= exercise.target.sets

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <button onClick={onAbort} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={22} />
        </button>
        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium">Übung {currentIndex + 1} / {exercises.length}</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{exercise.name}</p>
        </div>
        <button
          onClick={() => setShowInstructions((v) => !v)}
          className="text-xs font-semibold text-primary-500 px-2 py-1"
        >
          Anleitung
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex) / exercises.length) * 100}%` }}
        />
      </div>

      {/* Muscle tags */}
      <div className="flex gap-1.5 px-4 mt-3 flex-wrap">
        {exercise.primaryMuscles.map((m) => (
          <span key={m} className="text-[10px] font-semibold bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
            {MUSCLE_LABELS[m] ?? m}
          </span>
        ))}
      </div>

      {/* Instructions overlay */}
      {showInstructions && (
        <div className="mx-4 mt-3 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-lg z-10">
          <ol className="space-y-2">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          {exercise.chairVariantNote && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
              🪑 {exercise.chairVariantNote}
            </p>
          )}
        </div>
      )}

      {/* Demo */}
      <div className="flex-1 px-4 mt-3 min-h-0">
        <ExerciseDemo exercise={exercise} className="h-full" />
      </div>

      {/* Set tracker */}
      <div className="flex justify-center gap-2 px-4 mt-4">
        {Array.from({ length: exercise.target.sets }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 max-w-[40px] rounded-full transition-all ${
              i < currentSet - 1
                ? 'bg-primary-500'
                : i === currentSet - 1
                ? 'bg-primary-300'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-1">
        Satz {currentSet} / {exercise.target.sets}
      </p>

      {/* Controls */}
      <div className="px-4 pb-8 pt-4">
        {exercise.target.type === 'duration' ? (
          <div className="flex flex-col items-center gap-4">
            <CountdownTimer
              key={timerKey}
              seconds={exercise.target.seconds}
              onComplete={handleSetComplete}
            />
            <button
              onClick={handleSetComplete}
              className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl text-base shadow-lg shadow-primary-500/30 active:scale-95 transition-transform"
            >
              {isLastSet && isLast ? 'Fertig' : isLastSet ? 'Weiter' : 'Nächster Satz'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActualReps((r) => Math.max(0, r - 1))}
                className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
              >
                <Minus size={22} />
              </button>
              <div className="text-center">
                <div className="text-5xl font-black text-gray-900 dark:text-white w-24 text-center">{actualReps}</div>
                <div className="text-xs text-gray-400 mt-1">Wdh. (Soll: {exercise.target.reps})</div>
              </div>
              <button
                onClick={() => setActualReps((r) => r + 1)}
                className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
              >
                <Plus size={22} />
              </button>
            </div>
            <button
              onClick={handleSetComplete}
              className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl text-base shadow-lg shadow-primary-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {isLastSet && isLast ? 'Abschließen' : isLastSet ? 'Übung abschließen' : 'Satz abschließen'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between px-6 pb-6 -mt-2">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Zurück
        </button>
        <button
          onClick={() => setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1))}
          disabled={isLast}
          className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30"
        >
          Überspringen <ChevronRight size={16} />
        </button>
      </div>

      {showToast && lastResult && (
        <ExerciseResultToast
          points={lastResult.points}
          bonus={lastResult.bonus}
          onDone={() => {
            setShowToast(false)
            if (currentIndex + 1 < exercises.length && currentSet >= exercise.target.sets) {
              setCurrentIndex((i) => i + 1)
            }
          }}
        />
      )}
    </div>
  )
}
