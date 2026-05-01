import { NextRequest, NextResponse } from 'next/server'

import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminSessionMaxAge,
  verifyAdminCredentials,
  verifyTotpCode,
} from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = String(body.username || '').trim()
    const password = String(body.password || '')
    const code = String(body.code || '').trim()

    if (!username || !password || !code) {
      return NextResponse.json({ error: 'Username, password, and OTP code are required.' }, { status: 400 })
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
    }

    if (!verifyTotpCode(code)) {
      return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: createAdminSession(username),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getAdminSessionMaxAge(),
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
