import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/lib/supabase', () => {
  const calls = []
  const table = { delete: () => ({ eq: () => ({ select: async () => ({ data: [{ id: 9 }], error: null }) }) }), update: (p) => { calls.push(['update', p]); return { eq: async () => ({ data: null, error: null }) } } }
  return { supabase: { calls, from: () => table, storage: { from: () => ({ upload: async (p) => { calls.push(['upload', p]); return { error: null } }, remove: async (p) => { calls.push(['remove', p]); return { error: null } } }) } } }
})

describe('saveMemberFiles', () => {
  it('sube, quita y registra las rutas con el consentimiento', async () => {
    const { saveMemberFiles } = await import('../src/lib/api')
    const { supabase } = await import('../src/lib/supabase')
    await saveMemberFiles(3, 9, { photo: new Blob(['x']), dni_back: null })
    expect(supabase.calls[0]).toEqual(['upload', '3/9/photo.jpg'])
    expect(supabase.calls[1]).toEqual(['remove', ['3/9/dni_back.jpg']])
    const patch = supabase.calls[2][1]
    expect(patch.photo_path).toBe('3/9/photo.jpg')
    expect(patch.dni_back_path).toBeNull()
    expect(patch.consent_at).toBeTruthy()
    expect('dni_front_path' in patch).toBe(false)
  })
  it('no hace nada si no hay cambios', async () => {
    const { saveMemberFiles } = await import('../src/lib/api')
    const { supabase } = await import('../src/lib/supabase')
    supabase.calls.length = 0
    await saveMemberFiles(3, 9, {})
    expect(supabase.calls).toHaveLength(0)
  })
  it('al eliminar un miembro borra sus tres archivos', async () => {
    const { deleteMember } = await import('../src/lib/api')
    const { supabase } = await import('../src/lib/supabase')
    supabase.calls.length = 0
    await deleteMember(3, 9)
    expect(supabase.calls).toContainEqual(['remove', ['3/9/photo.jpg', '3/9/dni_front.jpg', '3/9/dni_back.jpg']])
  })
})

describe('seguridad de members', () => {
  it('la lista no usa select(*) ni pide los tokens del carnet', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../src/lib/api.js', import.meta.url), 'utf8')
    expect(src).not.toMatch(/from\('members'\)\.select\('\*'\)/)
    expect(src.match(/const MEMBER_COLS = '([^']+)'/)[1]).not.toMatch(/qr_token|enroll_token/)
  })
})
