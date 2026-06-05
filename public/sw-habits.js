/* Service Worker for Habit Reminders (best-effort, no backend required) */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('message', (event) => {
  if (!event.data) return
  if (event.data.type === 'SHOW_HABIT_REMINDER') {
    const { habitName, habitIcon } = event.data
    if (!self.registration.showNotification) return
    self.registration.showNotification(`${habitIcon} ${habitName}`, {
      body: 'Deine Gewohnheit wartet auf dich!',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `habit-${habitName}`,
      renotify: false,
    })
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/habits')
        }
      })
  )
})
