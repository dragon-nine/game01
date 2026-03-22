import type { LayoutElement } from './layout-types'
import { DEFAULT_LAYOUTS } from './default-layouts'

const BLOB_BASE = 'https://hhgnhfkftrktusxf.public.blob.vercel-storage.com'
const layoutCache = new Map<string, LayoutElement[]>()

/**
 * Fetch layout JSON directly from Vercel Blob (public access).
 * Falls back to built-in defaults if not found.
 */
export async function loadLayout(gameId: string, screen: string): Promise<LayoutElement[]> {
  const cacheKey = `${gameId}/${screen}`
  if (layoutCache.has(cacheKey)) return layoutCache.get(cacheKey)!

  try {
    const url = `${BLOB_BASE}/${gameId}/layout/${screen}.json`
    const res = await fetch(url)
    if (res.ok) {
      const layout = await res.json()
      const elements: LayoutElement[] = layout.elements || []
      layoutCache.set(cacheKey, elements)
      return elements
    }
  } catch { /* fallback to defaults */ }

  const defaults = DEFAULT_LAYOUTS[screen]?.elements || []
  layoutCache.set(cacheKey, defaults)
  return defaults
}

/** Clear cache (e.g., after admin saves a new layout) */
export function clearLayoutCache() {
  layoutCache.clear()
}
