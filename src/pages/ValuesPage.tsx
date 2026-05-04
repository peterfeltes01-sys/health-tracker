import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { WeightDashboard } from '../components/weight/WeightDashboard'
import { BPDashboard } from '../components/bloodPressure/BPDashboard'
import { BodyDashboard } from '../components/body/BodyDashboard'
import { CholesterolDashboard } from '../components/cholesterol/CholesterolDashboard'
import { BloodSugarDashboard } from '../components/bloodSugar/BloodSugarDashboard'
import { useWeightStore } from '../stores/weightStore'
import { useBloodPressureStore } from '../stores/bloodPressureStore'
import { useCholesterolStore } from '../stores/cholesterolStore'
import { useBloodSugarStore } from '../stores/bloodSugarStore'
import { subDays } from 'date-fns'
import { toISODate } from '../utils/calculations'
import { clsx } from 'clsx'

type Tab = 'weight' | 'bp' | 'body' | 'cholesterol' | 'bloodSugar'

const TABS: [Tab, string][] = [
  ['weight',      '⚖️ Gewicht'],
  ['bp',          '❤️ Blutdruck'],
  ['body',        '📏 Körper'],
  ['cholesterol', '🩸 Cholesterin'],
  ['bloodSugar',  '🍬 Blutzucker'],
]

export function ValuesPage() {
  const [tab, setTab] = useState<Tab>('weight')
  const { load: loadWeight } = useWeightStore()
  const { load: loadBP } = useBloodPressureStore()
  const { load: loadCholesterol } = useCholesterolStore()
  const { load: loadBloodSugar } = useBloodSugarStore()

  useEffect(() => {
    const from = toISODate(subDays(new Date(), 365))
    loadWeight(from)
    loadBP(from)
    loadCholesterol(from)
    loadBloodSugar(from)
  }, [])

  return (
    <>
      <Header title="Werte" />
      <PageWrapper>
        <div className="space-y-4">
          <div className="flex overflow-x-auto gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl p-1 scrollbar-hide">
            {TABS.map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  tab === t
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'weight'      && <WeightDashboard />}
          {tab === 'bp'          && <BPDashboard />}
          {tab === 'body'        && <BodyDashboard />}
          {tab === 'cholesterol' && <CholesterolDashboard />}
          {tab === 'bloodSugar'  && <BloodSugarDashboard />}
        </div>
      </PageWrapper>
    </>
  )
}
