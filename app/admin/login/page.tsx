"use client"

import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, LockKeyhole, LogIn } from 'lucide-react'

function AdminLoginForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/admin'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, code }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to sign in.')
        setIsSubmitting(false)
        return
      }

      // Use a hard redirect to bypass Next.js client-side cache and ensure 
      // the new session cookie is properly sent to the server for the admin layout.
      window.location.assign(nextPath)
    } catch {
      setError('Unable to sign in right now. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/10">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Protected area</p>
              <h1 className="text-2xl font-semibold">Admin Sign In</h1>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Username</span>
              <input
                type="text"
                value={username}
                onChange={event => setUsername(event.target.value)}
                autoComplete="username"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                placeholder="Admin username"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                placeholder="Admin password"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <LockKeyhole className="h-4 w-4" />
                OTP code
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={event => setCode(event.target.value.replace(/\D+/g, '').slice(0, 6))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 tracking-[0.35em] outline-none transition-colors focus:border-primary"
                placeholder="123456"
                required
              />
            </label>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Use your password and the 6-digit OTP code.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin/signup" className="text-primary hover:underline">
              Create admin account
            </Link>
            <Link href="/" className="text-primary hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}
