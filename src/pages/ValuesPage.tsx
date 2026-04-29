import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { WeightDashboard } from '../components/weight/WeightDashboard'
import { BPDashboard } from '../components/bloodPressure/BPDashboard'
import { useWeightStore } from '../stores/weightStore'
import { useBloodPressureStore } from '../stores/bloodPressureStore'
import { subDays } from 'date-fns'
import { toISODate } from '../utils/calculations'
import { clsx } from 'clsx'

type Tab = 'weight' | 'bp'

export function ValuesPage() {
  const [tab, setTab] = useState<Tab>('weight')
  const { load: loadWeight } = useWeightStore()
  const { load: loadBP } = useBloodPressureStore()

  useEffect(() => {
    const from = toISODate(subDays(new Date(), 365))
    loadWeight(from)
    loadBP(from)
  }, [])

  return (
    <>
      <Header title="Werte" />
      <PageWrapper>
        <div className="space-y-4">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 gap-1">
            {([['weight', '⚖️ Gewicht'], ['bp', '❤️ Blutdruck']] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  tab === t
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'weight' && <WeightDashboard />}
          {tab === 'bp' && <BPDashboard />}
        </div>
      </PageWrapper>
    </>
  )
}
