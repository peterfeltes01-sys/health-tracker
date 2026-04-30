import type { FoodProduct, NutritionFacts } from '../types'

const BASE = 'https://world.openfoodfacts.org'

// German food name → English search term (OFF stores most generic foods in English)
const DE_TO_EN: Record<string, string> = {
  // Obst
  banane: 'banana', bananen: 'banana',
  apfel: 'apple', äpfel: 'apple',
  birne: 'pear', birnen: 'pear',
  erdbeere: 'strawberry', erdbeeren: 'strawberry',
  heidelbeere: 'blueberry', heidelbeeren: 'blueberry',
  blaubeere: 'blueberry', blaubeeren: 'blueberry',
  himbeere: 'raspberry', himbeeren: 'raspberry',
  brombeere: 'blackberry', brombeeren: 'blackberry',
  orange: 'orange', orangen: 'orange',
  mandarine: 'mandarin', mandarinen: 'mandarin',
  clementine: 'clementine', clementinen: 'clementine',
  grapefruit: 'grapefruit',
  zitrone: 'lemon', zitronen: 'lemon',
  limette: 'lime', limetten: 'lime',
  mango: 'mango', mangos: 'mango',
  ananas: 'pineapple',
  traube: 'grape', trauben: 'grape', weintraube: 'grape', weintrauben: 'grape',
  kirsche: 'cherry', kirschen: 'cherry',
  pfirsich: 'peach', pfirsiche: 'peach',
  pflaume: 'plum', pflaumen: 'plum',
  nektarine: 'nectarine', nektarinen: 'nectarine',
  aprikose: 'apricot', aprikosen: 'apricot',
  wassermelone: 'watermelon',
  melone: 'melon',
  kiwi: 'kiwi',
  papaya: 'papaya',
  avocado: 'avocado', avocados: 'avocado',
  feige: 'fig', feigen: 'fig',
  // Gemüse
  karotte: 'carrot', karotten: 'carrot',
  möhre: 'carrot', möhren: 'carrot',
  tomate: 'tomato', tomaten: 'tomato',
  gurke: 'cucumber', gurken: 'cucumber',
  paprika: 'bell pepper',
  zucchini: 'zucchini',
  aubergine: 'eggplant', auberginen: 'eggplant',
  brokkoli: 'broccoli',
  blumenkohl: 'cauliflower',
  spinat: 'spinach',
  salat: 'lettuce', kopfsalat: 'lettuce',
  rucola: 'arugula',
  zwiebel: 'onion', zwiebeln: 'onion',
  knoblauch: 'garlic',
  lauch: 'leek',
  sellerie: 'celery',
  kartoffel: 'potato', kartoffeln: 'potato',
  süßkartoffel: 'sweet potato', süßkartoffeln: 'sweet potato',
  mais: 'corn',
  erbse: 'pea', erbsen: 'pea',
  bohne: 'bean', bohnen: 'bean',
  linse: 'lentil', linsen: 'lentil',
  kichererbse: 'chickpea', kichererbsen: 'chickpea',
  pilz: 'mushroom', pilze: 'mushroom',
  champignon: 'mushroom', champignons: 'mushroom',
  // Fleisch & Fisch
  hähnchen: 'chicken', hühnchen: 'chicken',
  rindfleisch: 'beef',
  schweinefleisch: 'pork',
  lammfleisch: 'lamb',
  pute: 'turkey', putenfleisch: 'turkey', truthahn: 'turkey',
  lachs: 'salmon',
  thunfisch: 'tuna',
  forelle: 'trout',
  garnele: 'shrimp', garnelen: 'shrimp',
  // Milchprodukte & Eier
  ei: 'egg', eier: 'egg',
  milch: 'milk',
  butter: 'butter',
  käse: 'cheese',
  sahne: 'cream',
  frischkäse: 'cream cheese',
  hüttenkäse: 'cottage cheese',
  // Getreide & Grundnahrung
  reis: 'rice',
  nudeln: 'pasta',
  brot: 'bread',
  brötchen: 'bread roll',
  mehl: 'flour',
  zucker: 'sugar',
  honig: 'honey',
  öl: 'oil',
  olivenöl: 'olive oil',
  // Nüsse & Samen
  mandel: 'almond', mandeln: 'almond',
  walnuss: 'walnut', walnüsse: 'walnut',
  haselnuss: 'hazelnut', haselnüsse: 'hazelnut',
  erdnuss: 'peanut', erdnüsse: 'peanut',
  cashew: 'cashew', cashews: 'cashew',
  pistazie: 'pistachio', pistazien: 'pistachio',
  sonnenblumenkerne: 'sunflower seeds',
  kürbiskerne: 'pumpkin seeds',
  chiasamen: 'chia seeds',
  leinsamen: 'flax seeds',
}

function translateQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .map(w => DE_TO_EN[w.toLowerCase()] ?? w)
    .join(' ')
}

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

  const searchTerm = translateQuery(query)
  const url =
    `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}` +
    `&search_simple=1&action=process&json=1&page_size=50` +
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
