import { useState } from 'react'
import { Search, ScanBarcode, WifiOff } from 'lucide-react'
import type { FoodProduct } from '../../types'
import { useFoodSearch } from '../../hooks/useFoodSearch'
import { BarcodeScanner } from './BarcodeScanner'
import { getProductByBarcode } from '../../lib/openFoodFacts'

interface Props {
  onSelect: (product: FoodProduct) => void
}

export function ProductSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const { results, loading, offError } = useFoodSearch(query)

  async function handleBarcode(barcode: string) {
    setShowScanner(false)
    setScanLoading(true)
    try {
      const product = await getProductByBarcode(barcode)
      if (product) {
        onSelect(product)
      } else {
        alert(`Barcode ${barcode} nicht gefunden`)
      }
    } catch {
      alert('Fehler beim Laden des Produkts')
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="search"
              placeholder="Lebensmittel suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            disabled={scanLoading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <ScanBarcode size={20} />
          </button>
        </div>

        {offError && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
            <WifiOff size={14} />
            <span>OFF-Suche nicht verfügbar. Eigene Produkte funktionieren weiter.</span>
          </div>
        )}

        {loading && (
          <p className="text-xs text-gray-400 text-center py-2">Suche…</p>
        )}

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {results.length === 0 && !loading && query.length > 1 && (
            <p className="text-sm text-gray-400 text-center py-4">Keine Ergebnisse für „{query}"</p>
          )}
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all text-left"
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-lg">
                  {product.source === 'custom' ? '⭐' : '🛒'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                {product.brand && (
                  <p className="text-xs text-gray-500 truncate">{product.brand}</p>
                )}
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  {product.per100g.kcal} kcal / 100g
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
