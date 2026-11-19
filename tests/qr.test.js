import { describe, it, expect } from 'vitest'
import QRCode from 'qrcode'
import jsQR from 'jsqr'

/** Dibuja el QR como imagen (como lo vería la cámara) y lo lee con el mismo decodificador que usa la app. */
function leer(text, scale = 6, quiet = 4) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size, size = (n + quiet * 2) * scale
  const px = new Uint8ClampedArray(size * size * 4).fill(255)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!qr.modules.get(y, x)) continue
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const i = (((y + quiet) * scale + dy) * size + (x + quiet) * scale + dx) * 4
      px[i] = px[i + 1] = px[i + 2] = 0
    }
  }
  return jsQR(px, size, size)?.data
}

describe('QR', () => {
  it('el carnet se lee de vuelta tal cual', () => {
    const payload = 'GYMXIO:12:9f3ab27c01de'
    expect(leer(payload)).toBe(payload)
    expect(leer(payload).startsWith('GYMXIO:')).toBe(true)
  })
  it('el enlace de vinculación y el del libro de reclamaciones se leen', () => {
    expect(leer('https://gymxio.vercel.app/enroll#3f2a9c7d1b4e8a60c5d2e1f09b8a7c64')).toContain('/enroll#')
    expect(leer('https://gymxio.vercel.app/reclamos?g=2f9b2305')).toContain('g=2f9b2305')
  })
  it('se lee aunque la imagen sea pequeña', () => expect(leer('GYMXIO:12:9f3ab27c01de', 3)).toBe('GYMXIO:12:9f3ab27c01de'))
})
