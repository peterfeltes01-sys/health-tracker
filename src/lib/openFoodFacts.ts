import type { FoodProduct, NutritionFacts } from '../types'

const BASE = 'https://world.openfoodfacts.org'

const memoryCache = new Map<string, { data: FoodProduct[]; expires: number }>()

function n(val: unknown): number {
  const v = Number(val)
  return isFinite(v) ? v : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToFoodProduct(off: any): FoodProduct | null {
  if (!off?.code) return null
  const nu = off.nutriments ?? {}
  const per100g: NutritionFacts = {
    kcal: n(nu['energy-kcal_100g'] ?? nu['energy-kcal'] ?? (n(nu['energy_100g']) / 4.184)),
    carbs: n(nu['carbohydrates_100g']),
    sugars: nu['sugars_100g'] != null ? n(nu['sugars_100g']) : undefined,
    fat: n(nu['fat_100g']),
    satFat: n(nu['saturated-fat_100g']),
    protein: n(nu['proteins_100g']),
    fiber: nu['fiber_100g'] != null ? n(nu['fiber_100g']) : undefined,
    salt: nu['salt_100g'] != null ? n(nu['salt_100g']) : undefined,
  }
  return {
    id: `off:${off.code}`,
    source: 'off',
    externalId: String(off.code),
    name: off.product_name_de || off.product_name || 'Unbekanntes Produkt',
    brand: off.brands || undefined,
    imageUrl: off.image_small_url || undefined,
    per100g,
    defaultServingGrams: off.serving_quantity ? n(off.serving_quantity) : undefined,
  }
}

export async function searchProducts(
  query: string,
  signal?: AbortSignal
): Promise<FoodProduct[]> {
  const cacheKey = `search:${query.toLowerCase().trim()}`
  const cached = memoryCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return cached.data

  const url =
    `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&lang=de&page_size=20` +
    `&fields=code,product_name,product_name_de,brands,image_small_url,nutriments,serving_quantity`

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('OFF API Error')

  const data = await res.json()
  const products = (data.products ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => mapToFoodProduct(p))
    .filter(Boolean) as FoodProduct[]

  memoryCache.set(cacheKey, { data: products, expires: Date.now() + 5 * 60 * 1000 })
  return products
}

export async function getProductByBarcode(
  barcode: string,
  signal?: AbortSignal
): Promise<FoodProduct | null> {
  const url =
    `${BASE}/api/v2/product/${barcode}.json` +
    `?fields=code,product_name,product_name_de,brands,image_small_url,nutriments,serving_quantity`

  const res = await fetch(url, { signal })
  if (!res.ok) return null

  const data = await res.json()
  if (data.status === 0) return null
  return mapToFoodProduct(data.product)
}
