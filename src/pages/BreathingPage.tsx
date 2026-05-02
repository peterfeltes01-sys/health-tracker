import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Wind, Moon, Zap, Brain, Play, Pause, RotateCcw, ChevronRight, CheckCircle } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'

type PhaseAction = 'inhale' | 'hold' | 'exhale' | 'hold-out'

interface Phase {
  label: string
  duration: number
  action: PhaseAction
}

interface Technique {
  id: string
  name: string
  intention: string
  desc: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  ringColor: string
  duration: string
  totalCycles: number
  phases: Phase[]
}

const TECHNIQUES: Technique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    intention: 'Stress abbauen',
    desc: 'Militärtechnik zur schnellen Stressreduktion und Fokussierung',
    icon: Zap,
    color: 'text-orange-500',
    ringColor: '#f97316',
    duration: '~8 Min.',
    totalCycles: 8,
    phases: [
      { label: 'Einatmen', duration: 4, action: 'inhale' },
      { label: 'Halten', duration: 4, action: 'hold' },
      { label: 'Ausatmen', duration: 4, action: 'exhale' },
      { label: 'Halten', duration: 4, action: 'hold-out' },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Methode',
    intention: 'Beruhigen',
    desc: 'Aktiviert den Parasympathikus für tiefe innere Ruhe',
    icon: Brain,
    color: 'text-blue-500',
    ringColor: '#3b82f6',
    duration: '~8 Min.',
    totalCycles: 4,
    phases: [
      { label: 'Einatmen', duration: 4, action: 'inhale' },
      { label: 'Halten', duration: 7, action: 'hold' },
      { label: 'Ausatmen', duration: 8, action: 'exhale' },
    ],
  },
  {
    id: 'sleep',
    name: 'Schlaf-Atmung',
    intention: 'Schlafvorbereitung',
    desc: 'Tiefe Entspannung für schnelleres Einschlafen',
    icon: Moon,
    color: 'text-indigo-500',
    ringColor: '#6366f1',
    duration: '~10 Min.',
    totalCycles: 5,
    phases: [
      { label: 'Einatmen', duration: 5, action: 'inhale' },
      { label: 'Halten', duration: 5, action: 'hold' },
      { label: 'Ausatmen', duration: 10, action: 'exhale' },
    ],
  },
  {
    id: 'calm',
    name: 'Kohärente Atmung',
    intention: 'Entspannen',
    desc: 'Balanciert das Nervensystem für nachhaltige Ruhe',
    icon: Wind,
    color: 'text-teal-500',
    ringColor: '#14b8a6',
    duration: '~5 Min.',
    totalCycles: 6,
    phases: [
      { label: 'Einatmen', duration: 5, action: 'inhale' },
      { label: 'Ausatmen', duration: 5, action: 'exhale' },
    ],
  },
]

export function BreathingPage() {
  const [selected, setSelected] = useState<Technique | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [completed, setCompleted] = useState(false)

  const circleRef = useRef<HTMLDivElement>(null)
  const cycleRef = useRef(0)

  // Animate breathing circle via DOM ref to avoid transition glitches
  useEffect(() => {
    const el = circleRef.current
    if (!el || !selected) return

    if (!isActive || isPaused) {
      el.style.transition = 'transform 0.5s ease-in-out'
      el.style.transform = 'scale(0.5)'
      return
    }

    const phase = selected.phases[phaseIndex]
    const expanded = phase.action === 'inhale' || phase.action === 'hold'
    const scale = expanded ? 1 : 0.42
    const dur = phase.action === 'inhale' || phase.action === 'exhale' ? phase.duration : 0.2

    el.style.transition = `transform ${dur}s ease-in-out`
    el.style.transform = `scale(${scale})`
  }, [phaseIndex, isActive, isPaused, selected])

  // Countdown timer per phase
  useEffect(() => {
    if (!isActive || isPaused || !selected) return

    const phase = selected.phases[phaseIndex]
    setTimeLeft(phase.duration)

    let count = 0
    const interval = setInterval(() => {
      count++
      const remaining = phase.duration - count
      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        const next = (phaseIndex + 1) % selected.phases.length

        if (next === 0) {
          cycleRef.current += 1
          setCycle(cycleRef.current)
          if (cycleRef.current >= selected.totalCycles) {
            setIsActive(false)
            setCompleted(true)
            return
          }
        }
        setPhaseIndex(next)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused, phaseIndex, selected])

  const startSession = (technique: Technique) => {
    cycleRef.current = 0
    setCycle(0)
    setPhaseIndex(0)
    setCompleted(false)
    setIsPaused(false)
    setIsActive(true)
    setSelected(technique)
  }

  const reset = () => {
    setIsActive(false)
    setIsPaused(false)
    setCompleted(false)
    setPhaseIndex(0)
    setCycle(0)
    cycleRef.current = 0
    setTimeLeft(0)
  }

  const backToList = () => {
    reset()
    setSelected(null)
  }

  const currentPhase = selected ? selected.phases[phaseIndex] : null

  // ── Selection screen ──────────────────────────────────────────
  if (!selected) {
    return (
      <>
        <Header title="Atemübungen" />
        <PageWrapper>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Wähle eine Übung passend zu deiner Absicht:
          </p>
          <div className="space-y-3">
            {TECHNIQUES.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => startSession(t)}
                  className="w-full flex items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${t.color}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.intention}</p>
                      <span className="text-xs text-gray-400">{t.duration}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {t.name} · {t.desc}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </button>
              )
            })}
          </div>

          {/* Phase legend */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Wie es funktioniert</p>
            <div className="space-y-2">
              {[
                { label: 'Einatmen', desc: 'Langsam durch die Nase einatmen' },
                { label: 'Halten', desc: 'Atem anhalten, entspannt bleiben' },
                { label: 'Ausatmen', desc: 'Kontrolliert durch den Mund ausatmen' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </PageWrapper>
      </>
    )
  }

  // ── Session screen ────────────────────────────────────────────
  const Icon = selected.icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header row */}
      <div className="px-4 pt-12 pb-2 flex items-center gap-3">
        <button
          onClick={backToList}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white leading-tight">{selected.intention}</h1>
          <p className="text-xs text-gray-400">{selected.name}</p>
        </div>
      </div>

      {/* Centered breathing area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32 gap-6">
        {completed ? (
          // ── Completed ──
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sehr gut!</h2>
              <p className="text-sm text-gray-400 mt-1">{selected.totalCycles} Runden abgeschlossen</p>
            </div>
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={() => startSession(selected)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg"
                style={{ backgroundColor: selected.ringColor }}
              >
                <RotateCcw size={16} />
                Nochmal
              </button>
              <button
                onClick={backToList}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm"
              >
                Beenden
              </button>
            </div>
          </div>
        ) : (
          // ── Active / ready ──
          <>
            {/* Breathing circle */}
            <div className="relative w-56 h-56 flex items-center justify-center">
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-full opacity-10"
                style={{ backgroundColor: selected.ringColor }}
              />
              <div
                className="absolute inset-3 rounded-full opacity-20"
                style={{ backgroundColor: selected.ringColor }}
              />
              {/* Animated inner circle */}
              <div
                ref={circleRef}
                className="absolute inset-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selected.ringColor, transform: 'scale(0.5)' }}
              >
                <div className="text-center text-white select-none">
                  {isActive && !isPaused && currentPhase ? (
                    <>
                      <div className="text-3xl font-bold tabular-nums">{timeLeft}</div>
                      <div className="text-xs font-medium opacity-80 mt-0.5">{currentPhase.label}</div>
                    </>
                  ) : (
                    <Icon size={34} className="opacity-80" />
                  )}
                </div>
              </div>
            </div>

            {/* Phase label & cycle counter */}
            <div className="text-center min-h-[40px]">
              {isActive && !isPaused && currentPhase ? (
                <>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{currentPhase.label}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Runde {cycle + 1} von {selected.totalCycles}
                  </p>
                </>
              ) : isPaused ? (
                <p className="text-sm text-gray-400">Pausiert · Runde {cycle + 1} von {selected.totalCycles}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selected.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {selected.totalCycles} Runden · {selected.duration}
                  </p>
                </>
              )}
            </div>

            {/* Phase breakdown (only before start) */}
            {!isActive && !isPaused && (
              <div className="flex gap-3 justify-center">
                {selected.phases.map((phase, i) => (
                  <div key={i} className="text-center min-w-[44px]">
                    <div
                      className="w-full h-1.5 rounded-full mb-1"
                      style={{ backgroundColor: selected.ringColor, opacity: 0.25 + (phase.duration / 20) }}
                    />
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{phase.duration}s</div>
                    <div className="text-[10px] text-gray-400">{phase.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              {isActive && (
                <button
                  onClick={reset}
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
              )}

              <button
                onClick={() => {
                  if (!isActive) {
                    startSession(selected)
                  } else {
                    setIsPaused((p) => !p)
                  }
                }}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg text-base active:opacity-80 transition-opacity"
                style={{ backgroundColor: selected.ringColor }}
              >
                {!isActive ? (
                  <>
                    <Play size={20} fill="white" />
                    Starten
                  </>
                ) : isPaused ? (
                  <>
                    <Play size={20} fill="white" />
                    Fortfahren
                  </>
                ) : (
                  <>
                    <Pause size={20} fill="white" />
                    Pause
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
