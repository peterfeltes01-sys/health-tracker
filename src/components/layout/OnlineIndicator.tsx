import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function OnlineIndicator() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (online) return null

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
      <WifiOff size={12} />
      <span>Offline</span>
    </div>
  )
}

export function OnlineStatusBadge() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium ${
        online
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-amber-600 dark:text-amber-400'
      }`}
    >
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      <span>{online ? 'Synchronisiert' : 'Offline – wird gespeichert'}</span>
    </div>
  )
}
