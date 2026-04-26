import { useState } from 'react'
import { Download, Upload, Trash2, Moon, Sun, Monitor } from 'lucide-react'
import { repository } from '../../repositories/LocalStorageRepository'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../shared/Button'
import { Card } from '../shared/Card'

export function DataManagement() {
  const { settings, update } = useSettingsStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [importError, setImportError] = useState('')

  async function handleExport() {
    const data = await repository.exportAll()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        await repository.importAll(text)
        window.location.reload()
      } catch {
        setImportError('Ungültige Datei. Bitte eine gültige Export-Datei wählen.')
      }
    }
    input.click()
  }

  async function handleClear() {
    await repository.clearAll()
    window.location.reload()
  }

  const themeOptions: { value: UserSettings['theme']; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Hell' },
    { value: 'dark', icon: Moon, label: 'Dunkel' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  type UserSettings = { theme: 'light' | 'dark' | 'system' }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🎨 Erscheinungsbild</h3>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => update({ theme: value })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                settings.theme === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                  : 'border-gray-100 dark:border-gray-800 text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📦 Datenverwaltung</h3>
        <div className="space-y-3">
          <Button variant="secondary" fullWidth onClick={handleExport}>
            <Download size={16} /> Daten exportieren (JSON)
          </Button>
          <Button variant="secondary" fullWidth onClick={handleImport}>
            <Upload size={16} /> Daten importieren
          </Button>
          {importError && <p className="text-sm text-red-500">{importError}</p>}

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            {confirmDelete ? (
              <div className="space-y-2">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ⚠️ Alle Daten werden unwiderruflich gelöscht!
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
                  <Button variant="danger" fullWidth onClick={handleClear}>Löschen bestätigen</Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(true)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 size={16} /> Alle Daten löschen
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
