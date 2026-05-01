import crypto from 'crypto'

export const ADMIN_SESSION_COOKIE = 'tabletalk_admin_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12

type AdminSessionPayload = {
  username: string
  expiresAt: number
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured.`)
  }

  return value
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function createSignature(payload: string) {
  const secret = getRequiredEnv('ADMIN_SESSION_SECRET')
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

function decodeBase32(input: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const normalized = input.replace(/=+$/g, '').replace(/[\s-]/g, '').toUpperCase()

  let bits = ''
  for (const character of normalized) {
    const index = alphabet.indexOf(character)
    if (index === -1) {
      throw new Error('ADMIN_TOTP_SECRET must be base32 encoded.')
    }
    bits += index.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2))
  }

  return Buffer.from(bytes)
}

function generateTotp(secret: string, unixTimeSeconds: number) {
  const key = decodeBase32(secret)
  const step = 30
  const counter = Math.floor(unixTimeSeconds / step)
  const buffer = Buffer.alloc(8)
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buffer.writeUInt32BE(counter % 0x100000000, 4)

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary = (((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff)) >>> 0

  return String(binary % 1_000_000).padStart(6, '0')
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = getRequiredEnv('ADMIN_USERNAME')
  const expectedPassword = getRequiredEnv('ADMIN_PASSWORD')

  return safeCompare(username, expectedUsername) && safeCompare(password, expectedPassword)
}

export function verifyTotpCode(code: string) {
  const secret = getRequiredEnv('ADMIN_TOTP_SECRET')
  const normalizedCode = code.replace(/\s+/g, '')
  const unixTimeSeconds = Math.floor(Date.now() / 1000)

  for (let drift = -1; drift <= 1; drift += 1) {
    const expected = generateTotp(secret, unixTimeSeconds + drift * 30)
    if (safeCompare(normalizedCode, expected)) {
      return true
    }
  }

  return false
}

export function createAdminSession(username: string) {
  const payload: AdminSessionPayload = {
    username,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }

  const serializedPayload = JSON.stringify(payload)
  const encodedPayload = base64UrlEncode(serializedPayload)
  const signature = createSignature(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function getAdminSessionMaxAge() {
  return Math.floor(SESSION_DURATION_MS / 1000)
}
