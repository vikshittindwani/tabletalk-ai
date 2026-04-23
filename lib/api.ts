const DEFAULT_API_URL = 'http://localhost:8000'

export function getApiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiUrl()}${normalizedPath}`
}
