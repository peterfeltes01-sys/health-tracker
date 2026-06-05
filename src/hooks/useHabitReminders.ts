import { useEffect, useRef } from 'react'
import type { Habit } from '../types/habits'

let swRegistration: ServiceWorkerRegistration | null = null

async function ensureSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null
  if (swRegistration) return swRegistration
  try {
    swRegistration = await navigator.serviceWorker.register('/sw-habits.js')
    return swRegistration
  } catch {
    return null
  }
}

async function showNotification(habit: Habit, reg: ServiceWorkerRegistration) {
  const sw = reg.active ?? reg.installing ?? reg.waiting
  if (!sw) return
  sw.postMessage({ type: 'SHOW_HABIT_REMINDER', habitName: habit.name, habitIcon: habit.icon })
}

export function useHabitReminders(habits: Habit[]) {
  const shownToday = useRef(new Set<string>())

  useEffect(() => {
    if (!('Notification' in window)) return

    let intervalId: ReturnType<typeof setInterval>

    async function requestAndSetup() {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
      if (Notification.permission !== 'granted') return

      const reg = await ensureSW()

      function checkReminders() {
        const now = new Date()
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const todayKey = now.toISOString().slice(0, 10)

        // Reset shown set each new day
        const existingDate = shownToday.current.values().next().value
        if (existingDate && existingDate.startsWith('date:') && !existingDate.startsWith(`date:${todayKey}`)) {
          shownToday.current.clear()
        }
        shownToday.current.add(`date:${todayKey}`)

        for (const habit of habits) {
          if (!habit.reminderTime || habit.archivedAt) continue
          const key = `${todayKey}-${habit.id}`
          if (shownToday.current.has(key)) continue
          if (hhmm === habit.reminderTime) {
            shownToday.current.add(key)
            if (reg) {
              showNotification(habit, reg)
            } else {
              // Fallback: direct Notification API
              try {
                new Notification(`${habit.icon} ${habit.name}`, {
                  body: 'Deine Gewohnheit wartet auf dich!',
                  tag: key,
                })
              } catch {
                // ignore
              }
            }
          }
        }
      }

      checkReminders()
      intervalId = setInterval(checkReminders, 60_000)
    }

    requestAndSetup()
    return () => clearInterval(intervalId)
  }, [habits])
}
