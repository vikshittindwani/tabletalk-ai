import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://tabletalk-ai.onrender.com'
    : 'http://localhost:8000'

function getBackendUrl() {
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/+$/, '')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params
  let response: Response

  try {
    response = await fetch(`${getBackendUrl()}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body: await request.text(),
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
