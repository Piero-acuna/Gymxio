/** Convierte cualquier imagen a JPEG reducido (quita datos EXIF como la ubicación). */
export async function toJpeg(file, max = 1280, quality = 0.82) {
  if (!file.type?.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  let bmp
  try { bmp = await createImageBitmap(file) } catch { throw new Error('Formato de imagen no compatible. Usa JPG o PNG.') }
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const cv = document.createElement('canvas')
  cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s)
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height)
  bmp.close?.()
  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo procesar la imagen.'))), 'image/jpeg', quality))
}
