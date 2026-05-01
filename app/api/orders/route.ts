import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://tabletalk-ai.onrender.com'
    : 'http://localhost:8000'

function getBackendUrl() {
  return (
    process.env.BACKEND_API_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/+$/, '')
}

async function proxyOrders(request: NextRequest) {
  const body = request.method === 'GET' ? undefined : await request.text()
  let response: Response

  try {
    response = await fetch(`${getBackendUrl()}/api/orders`, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body,
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ error: 'Backend orders API is unavailable.' }, { status: 502 })
  }

  const responseBody = await response.text()
  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    },
  })
}

export async function GET(request: NextRequest) {
  return proxyOrders(request)
}

export async function POST(request: NextRequest) {
  return proxyOrders(request)
}
