import { useEffect, useRef } from 'react'
import type { PRResult } from '../../../types/training'

interface PrCelebrationProps {
  pr: PRResult
  onDone: () => void
}

function useReducedMotion(): boolean {
  const query = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null
  return query?.matches ?? false
}

function ConfettiCanvas({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rotation: number; rotSpeed: number
    }> = []

    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      })
    }

    let raf: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.rotation += p.rotSpeed
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      }
      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  if (reduced) return null
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    />
  )
}

export function PrCelebration({ pr, onDone }: PrCelebrationProps) {
  const reduced = useReducedMotion()

  useEffect(() => {
    const t = setTimeout(onDone, reduced ? 1000 : 2000)
    return () => clearTimeout(t)
  }, [onDone, reduced])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <ConfettiCanvas reduced={reduced} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl px-8 py-6 text-center max-w-xs mx-4">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-2xl font-black text-gray-900 dark:text-white">Persönlicher Rekord!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pr.exerciseName}</p>
        <p className="text-3xl font-black text-primary-500 mt-2">{pr.reps} Wdh.</p>
        {pr.variationLevel > 0 && (
          <p className="text-xs text-gray-400 mt-1">Stufe {pr.variationLevel}</p>
        )}
      </div>
    </div>
  )
}
