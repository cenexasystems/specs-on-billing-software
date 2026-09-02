import type React from 'react'
import { resolveProductImage } from './productImageResolver'

export { resolveProductImage }
export const PLACEHOLDER = '/product-placeholder.svg'

export function getProductImage(name: string, _category: string, dbUrl?: string | null, _size: 'card' | 'tile' | 'detail' = 'card'): string {
  return dbUrl?.trim() || resolveProductImage(name) || PLACEHOLDER
}

export function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const image = e.currentTarget
  if (image.dataset.errored) return
  image.dataset.errored = '1'
  image.onerror = null
  image.src = PLACEHOLDER
}
