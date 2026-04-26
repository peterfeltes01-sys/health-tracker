import React from 'react'

interface PageWrapperProps {
  children: React.ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <main className="max-w-lg mx-auto w-full px-4 py-4 pb-24 min-h-screen">
      {children}
    </main>
  )
}
