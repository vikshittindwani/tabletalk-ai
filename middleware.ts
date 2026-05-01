import { type NextRequest, NextResponse } from 'next/server'

const ADMIN_SESSION_COOKIE = 'tabletalk_admin_session'
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/signup'])

function base64UrlToText(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return atob(padded)
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function createSignature(payload: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return bytesToHex(signature)
}

async function isValidAdminSession(sessionValue: string | undefined) {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || !sessionValue) {
    return false
  }

  const [payload, signature] = sessionValue.split('.')
  if (!payload || !signature) {
    return false
  }

  const expectedSignature = await createSignature(payload, secret)
  if (signature !== expectedSignature) {
    return false
  }

  try {
    const session = JSON.parse(base64UrlToText(payload)) as { expiresAt?: number }
    return typeof session.expiresAt === 'number' && session.expiresAt > Date.now()
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin') || PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const sessionValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (await isValidAdminSession(sessionValue)) {
    return NextResponse.next()
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
