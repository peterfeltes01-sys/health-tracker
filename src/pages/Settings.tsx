import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { SettingsForm } from '../components/settings/SettingsForm'
import { DataManagement } from '../components/settings/DataManagement'
import { ProfileSection } from '../components/settings/ProfileSection'
import { NutritionGoalsForm } from '../components/settings/NutritionGoalsForm'

export function Settings() {
  return (
    <>
      <Header title="Einstellungen" />
      <PageWrapper>
        <div className="space-y-5">
          <ProfileSection />
          <SettingsForm />
          <NutritionGoalsForm />
          <DataManagement />
          <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-600">
            HealthTrack v2.0 · Firebase · Triathlon · Cornhole · Wandern
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
