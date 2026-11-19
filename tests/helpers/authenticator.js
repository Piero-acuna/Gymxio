// Autenticador por software: genera respuestas WebAuthn reales (clave ES256) para probar la verificación del servidor
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto'
import { isoCBOR } from '@simplewebauthn/server/helpers'

const sha = (b) => createHash('sha256').update(b).digest()
const b64 = (b) => Buffer.from(b).toString('base64url')
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b }

export function makeAuthenticator() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const jwk = publicKey.export({ format: 'jwk' })
  const credId = randomBytes(16)
  const cose = Buffer.from(isoCBOR.encode(new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x, 'base64url')], [-3, Buffer.from(jwk.y, 'base64url')]])))
  let counter = 0
  const base = { id: b64(credId), rawId: b64(credId), type: 'public-key', clientExtensionResults: {}, authenticatorAttachment: 'platform' }
  return {
    credId: b64(credId),
    otherKey: generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey,
    register({ options, origin, rpID }) {
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin, crossOrigin: false }))
      const len = Buffer.alloc(2); len.writeUInt16BE(credId.length)
      const authData = Buffer.concat([sha(rpID), Buffer.from([0x45]), u32(counter), Buffer.alloc(16), len, credId, cose])
      const attestationObject = Buffer.from(isoCBOR.encode(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]])))
      return { ...base, response: { clientDataJSON: b64(clientDataJSON), attestationObject: b64(attestationObject), transports: ['internal'] } }
    },
    login({ options, origin, rpID, key = privateKey }) {
      counter += 1
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: options.challenge, origin, crossOrigin: false }))
      const authData = Buffer.concat([sha(rpID), Buffer.from([0x05]), u32(counter)])
      const signature = sign('sha256', Buffer.concat([authData, sha(clientDataJSON)]), key)
      return { ...base, response: { authenticatorData: b64(authData), clientDataJSON: b64(clientDataJSON), signature: b64(signature) } }
    },
  }
}
