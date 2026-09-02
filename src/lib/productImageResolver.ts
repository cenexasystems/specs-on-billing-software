/** Generic image resolver: product images are database-owned, never name-mapped. */
export function resolveProductImage(_productName: string, _variantName?: string | null): string | null {
  return null
}
