import type { ScreenLayout, LayoutElement } from './layout-types'
import { DEFAULT_LAYOUTS } from './default-layouts'

const BLOB_LIST_API = '/api/blob-list'
const layoutCache = new Map<string, LayoutElement[]>()

/**
 * Fetch layout from Vercel Blob, falling back to built-in defaults.
 * Results are cached in memory for the session.
 */
export async function loadLayout(gameId: string, screen: string): Promise<LayoutElement[]> {
  const cacheKey = `${gameId}/${screen}`
  if (layoutCache.has(cacheKey)) return layoutCache.get(cacheKey)!

  try {
    const res = await fetch(`${BLOB_LIST_API}?prefix=${encodeURIComponent(`${gameId}/layout/`)}`)
    if (res.ok) {
      const data = await res.json()
      const blob = data.blobs?.find((b: { pathname: string }) => b.pathname === `${gameId}/layout/${screen}.json`)
      if (blob?.url) {
        const layoutRes = await fetch(blob.url)
        if (layoutRes.ok) {
          const layout: ScreenLayout = await layoutRes.json()
          layoutCache.set(cacheKey, layout.elements)
          return layout.elements
        }
      }
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
