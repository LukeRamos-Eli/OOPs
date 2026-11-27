import { supabase } from './supabase'

const BUCKET = 'menu-images'
const MAX_SIDE = 800 // pixels, longest side

export function imageUrl(path: string | null | undefined) {
  if (!path) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Resize and re-encode as a light JPEG (usually 50-150 KB)
async function compress(file: File): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Could not read that image. Use a JPEG or PNG photo.')
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image.')
  ctx.fillStyle = '#fff' // transparent PNGs become white, not black
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  let blob: Blob | null = null
  for (const quality of [0.75, 0.6, 0.45]) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= 400_000) break
  }
  if (!blob) throw new Error('Could not compress the image.')
  return blob
}

export async function uploadMenuImage(file: File): Promise<string> {
  const blob = await compress(file)
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error
  return path
}

// Never throws: a leftover file is harmless, a failed delete shouldn't break saving
export async function deleteMenuImage(path: string | null | undefined) {
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}