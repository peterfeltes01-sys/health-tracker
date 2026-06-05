import { useState } from 'react'
import { Trophy, Flame, Star, ChevronRight, Medal } from 'lucide-react'
import type { WorkoutSession, Achievement } from '../../types/workout'

const MEDAL_COLORS = {
  bronze: 'text-amber-700 bg-amber-100 dark:bg-amber-950',
  silber: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  gold: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
}

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      color: ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6'][Math.floor(Math.random() * 6)],
      size: 6 + Math.random() * 6,
    }))
  )

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-fall"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + Math.random()}s`,
          }}
        >
          <div
            className="rounded-sm rotate-45"
            style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          />
        </div>
      ))}
    </div>
  )
}

interface SessionSummaryProps {
  session: WorkoutSession
  newAchievements: Achievement[]
  onDone: () => void
}

export function SessionSummary({ session, newAchievements, onDone }: SessionSummaryProps) {
  const [showConfetti] = useState(true)
  const minutes = Math.round(session.durationSeconds / 60)
  const metCount = session.performed.filter((p) => p.metTarget).length

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 overflow-y-auto pb-24">
      {showConfetti && <Confetti />}

      <div className="px-4 pt-12 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-4">
          <Trophy size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Einheit abgeschlossen!</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{session.date}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mx-4 mt-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
          <div className="text-2xl font-black text-primary-500">{session.totalPoints}</div>
          <div className="text-[10px] text-gray-400 font-medium mt-0.5">Punkte</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
          <div className="text-2xl font-black text-gray-900 dark:text-white">{minutes}'</div>
          <div className="text-[10px] text-gray-400 font-medium mt-0.5">Minuten</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
          <div className="text-2xl font-black text-emerald-500">{metCount}/{session.performed.length}</div>
          <div className="text-[10px] text-gray-400 font-medium mt-0.5">Ziele erreicht</div>
        </div>
      </div>

      {session.bonusPoints > 0 && (
        <div className="mx-4 mt-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3 flex items-center gap-3 border border-amber-100 dark:border-amber-900">
          <Star size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Bonus-Punkte</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              +{session.bonusPoints} Punkte für Mehrleistung
            </p>
          </div>
        </div>
      )}

      {/* Exercise breakdown */}
      <div className="mx-4 mt-4">
        <h2 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Übungen</h2>
        <div className="space-y-2">
          {session.performed.map((p) => (
            <div key={p.exerciseId} className="bg-white dark:bg-gray-900 rounded-2xl p-3 flex items-center gap-3 border border-gray-100 dark:border-gray-800">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${p.metTarget ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {p.metTarget ? (
                  <Flame size={16} className="text-emerald-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.nameSnapshot}</p>
                <p className="text-xs text-gray-400">
                  {p.targetSnapshot.type === 'reps'
                    ? `${p.actual.sets}×${p.actual.reps} Wdh.`
                    : `${p.actual.sets}×${p.actual.seconds}s`}
                </p>
              </div>
              <div className="text-sm font-bold text-primary-500">+{p.pointsEarned}</div>
            </div>
          ))}
        </div>
      </div>

      {/* New achievements */}
      {newAchievements.length > 0 && (
        <div className="mx-4 mt-4">
          <h2 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Neue Auszeichnungen</h2>
          <div className="space-y-2">
            {newAchievements.map((a) => (
              <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl p-3 flex items-center gap-3 border border-gray-100 dark:border-gray-800">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${MEDAL_COLORS[a.tier]}`}>
                  <Medal size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 mt-6">
        <button
          onClick={onDone}
          className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl text-base shadow-lg shadow-primary-500/30 active:scale-95 transition-transform"
        >
          Zurück zum Dashboard
        </button>
      </div>
    </div>
  )
}
