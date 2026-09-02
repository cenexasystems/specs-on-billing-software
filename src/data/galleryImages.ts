export interface GalleryImage {
  id: number
  title: string
  description: string
  image: string
  tags: string[]
}

/** Optional business-owned gallery data. Keep empty until the owner supplies images. */
export const galleryImages: GalleryImage[] = []
