import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react'
import { CustomProductForm } from '../components/nutrition/CustomProductForm'
import { Modal } from '../components/shared/Modal'
import { Button } from '../components/shared/Button'
import { useNutritionStore } from '../stores/nutritionStore'
import type { FoodProduct } from '../types'

export function CustomProductsPage() {
  const navigate = useNavigate()
  const { customProducts, loadCustomProducts, addCustomProduct, updateCustomProduct, deleteCustomProduct } = useNutritionStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FoodProduct | undefined>()

  useEffect(() => { loadCustomProducts() }, [])

  async function handleSave(product: Omit<FoodProduct, 'id' | 'source'>) {
    if (editing) {
      await updateCustomProduct({ ...product, id: editing.id, source: 'custom' })
    } else {
      await addCustomProduct(product)
    }
    setShowForm(false)
    setEditing(undefined)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold text-gray-900 dark:text-white">Eigene Produkte</h1>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Neu
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {customProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Noch keine eigenen Produkte</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Lege Produkte mit eigenen Nährwerten an</p>
          </div>
        )}

        {customProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-xl flex-shrink-0">⭐</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{product.name}</p>
              {product.brand && <p className="text-xs text-gray-500 truncate">{product.brand}</p>}
              <p className="text-xs text-primary-600 dark:text-primary-400">
                {product.per100g.kcal} kcal · {product.per100g.carbs}g K · {product.per100g.fat}g F · {product.per100g.protein}g E
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(product); setShowForm(true) }} className="p-2 text-gray-400 hover:text-primary-500 transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => deleteCustomProduct(product.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined) }}
        title={editing ? 'Produkt bearbeiten' : 'Eigenes Produkt anlegen'}
      >
        <CustomProductForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(undefined) }}
        />
      </Modal>
    </div>
  )
}
