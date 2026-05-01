"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Chrome, KeyRound, Mail, MessageSquareText, ShieldPlus, UserPlus } from "lucide-react"

import { supabase } from "@/lib/supabase"

type AuthMethod = "google" | "email" | "phone" | "form"

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function getFriendlyAuthError(error: { code?: string; message: string }) {
  if (error.code === "over_email_send_rate_limit") {
    return "Email OTP limit reached. Please wait before requesting another code, or configure custom SMTP in Supabase to raise the email limit."
  }

  const message = error.message.toLowerCase()

  if (message.includes("sms") || message.includes("phone")) {
    return `${error.message}. Make sure Phone Auth is enabled in Supabase and an SMS provider is configured.`
  }

  return error.message
}

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[\s()-]/g, "")
}

export default function AdminSignupPage() {
  const router = useRouter()
  const [activeMethod, setActiveMethod] = useState<AuthMethod>("form")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneOtp, setPhoneOtp] = useState("")
  const [phoneStep, setPhoneStep] = useState<"collect" | "verify">("collect")

  const [emailOtp, setEmailOtp] = useState("")
  const [emailStep, setEmailStep] = useState<"collect" | "verify">("collect")

  const supabaseReady = useMemo(() => isSupabaseConfigured(), [])

  const resetMessages = () => {
    setError("")
    setStatus("")
  }

  const getEmailRedirectUrl = () => {
    if (typeof window === "undefined") {
      return undefined
    }

    return `${window.location.origin}/admin/login`
  }

  const handleGoogleSignup = async () => {
    resetMessages()

    if (!supabaseReady) {
      setError("Supabase is not configured yet. Add your public URL and anon key first.")
      return
    }

    setIsSubmitting(true)

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    })

    if (authError) {
      setError(authError.message)
      setIsSubmitting(false)
      return
    }
  }

  const handleFormSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()

    if (!supabaseReady) {
      setError("Supabase is not configured yet. Add your public URL and anon key first.")
      return
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.")
      return
    }

    setIsSubmitting(true)

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
        data: {
          username: username.trim(),
          role: "admin",
        },
      },
    })

    setIsSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setStatus("Account created. Check your email to confirm the account, then sign in.")
    setUsername("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }

  const handleEmailOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()

    if (!supabaseReady) {
      setError("Supabase is not configured yet. Add your public URL and anon key first.")
      return
    }

    setIsSubmitting(true)

    if (emailStep === "collect") {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: getEmailRedirectUrl(),
          data: {
            username: username.trim(),
            role: "admin",
          },
        },
      })

      setIsSubmitting(false)

      if (authError) {
        setError(getFriendlyAuthError(authError))
        return
      }

      setEmailStep("verify")
      setStatus("OTP sent. Check your email inbox and enter the code to finish signup.")
      return
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: emailOtp.trim(),
      type: "email",
    })

    setIsSubmitting(false)

    if (verifyError) {
      setError(getFriendlyAuthError(verifyError))
      return
    }

    setStatus("Email OTP verified. Redirecting to the admin dashboard.")
    router.push("/admin")
    router.refresh()
  }

  const handlePhoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()

    if (!supabaseReady) {
      setError("Supabase is not configured yet. Add your public URL and anon key first.")
      return
    }

    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhoneNumber)) {
      setError("Enter the phone number with country code, for example +919876543210.")
      return
    }

    setIsSubmitting(true)

    if (phoneStep === "collect") {
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhoneNumber,
        options: {
          shouldCreateUser: true,
          data: {
            role: "admin",
          },
        },
      })

      setIsSubmitting(false)

      if (authError) {
        setError(getFriendlyAuthError(authError))
        return
      }

      setPhoneStep("verify")
      setPhoneNumber(normalizedPhoneNumber)
      setStatus("OTP requested. Enter the code from your SMS to finish signup.")
      return
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalizedPhoneNumber,
      token: phoneOtp.trim(),
      type: "sms",
    })

    setIsSubmitting(false)

    if (verifyError) {
      setError(getFriendlyAuthError(verifyError))
      return
    }

    setStatus("Phone signup complete. Redirecting to the admin dashboard.")
    router.push("/admin")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/10 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-border bg-muted/30 p-8 lg:border-b-0 lg:border-r">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldPlus className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin access</p>
                <h1 className="text-3xl font-semibold">Create Admin Account</h1>
              </div>
            </div>

            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Set up a new admin account using Google, email OTP, phone OTP, or the classic form flow with username, Gmail,
              password, and confirm password.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  id: "google" as const,
                  icon: Chrome,
                  title: "Google signup",
                  copy: "Fastest option if Google provider is enabled in Supabase.",
                },
                {
                  id: "email" as const,
                  icon: Mail,
                  title: "Email OTP signup",
                  copy: "Sends a 6-digit OTP to the email address you enter.",
                },
                {
                  id: "phone" as const,
                  icon: MessageSquareText,
                  title: "Phone signup",
                  copy: "Sends an OTP to the phone number you enter.",
                },
                {
                  id: "form" as const,
                  icon: KeyRound,
                  title: "Form signup",
                  copy: "Create an account with username, Gmail, and password.",
                },
              ].map(option => {
                const Icon = option.icon
                const isActive = activeMethod === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      resetMessages()
                      setActiveMethod(option.id)
                    }}
                    className={`flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/70"
                    }`}
                  >
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{option.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{option.copy}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              This page expects Supabase Auth to be configured with Google and, for phone signup, an SMS provider.
            </div>
          </section>

          <section className="p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Authentication</p>
                <h2 className="text-2xl font-semibold">
                  {activeMethod === "google" && "Signup with Google"}
                  {activeMethod === "email" && "Signup with Email OTP"}
                  {activeMethod === "phone" && "Signup with Phone"}
                  {activeMethod === "form" && "Signup with Form"}
                </h2>
              </div>

              <Link href="/admin/login" className="text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>

            {!supabaseReady && (
              <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {status && (
              <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {status}
              </div>
            )}

            {activeMethod === "google" && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Continue with your Google account and Supabase will handle the OAuth flow for admin signup.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Chrome className="h-5 w-5" />
                  {isSubmitting ? "Connecting to Google..." : "Continue with Google"}
                </button>
              </div>
            )}

            {activeMethod === "phone" && (
              <form className="space-y-4" onSubmit={handlePhoneSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Phone number</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={event => setPhoneNumber(event.target.value)}
                    autoComplete="tel"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                    placeholder="+919876543210"
                    required
                    disabled={isSubmitting || phoneStep === "verify"}
                  />
                </label>

                {phoneStep === "verify" && (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">OTP code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={phoneOtp}
                      onChange={event => setPhoneOtp(event.target.value.replace(/\D+/g, "").slice(0, 6))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 tracking-[0.35em] outline-none transition-colors focus:border-primary"
                      placeholder="123456"
                      required
                    />
                  </label>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    {isSubmitting
                      ? phoneStep === "collect"
                        ? "Sending OTP..."
                        : "Verifying..."
                      : phoneStep === "collect"
                        ? "Send OTP"
                        : "Verify OTP"}
                  </button>

                  {phoneStep === "verify" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep("collect")
                        setPhoneOtp("")
                        resetMessages()
                      }}
                      className="rounded-xl border border-border px-4 py-3 font-medium transition-colors hover:bg-muted"
                    >
                      Change number
                    </button>
                  )}
                </div>
              </form>
            )}

            {activeMethod === "email" && (
              <form className="space-y-4" onSubmit={handleEmailOtpSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    autoComplete="username"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                    placeholder="admin-user"
                    required
                    disabled={isSubmitting || emailStep === "verify"}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    autoComplete="email"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                    placeholder="admin@gmail.com"
                    required
                    disabled={isSubmitting || emailStep === "verify"}
                  />
                </label>

                {emailStep === "verify" && (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">OTP code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={emailOtp}
                      onChange={event => setEmailOtp(event.target.value.replace(/\D+/g, "").slice(0, 6))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 tracking-[0.35em] outline-none transition-colors focus:border-primary"
                      placeholder="123456"
                      required
                    />
                  </label>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Mail className="h-4 w-4" />
                    {isSubmitting
                      ? emailStep === "collect"
                        ? "Sending OTP..."
                        : "Verifying..."
                      : emailStep === "collect"
                        ? "Send OTP"
                        : "Verify OTP"}
                  </button>

                  {emailStep === "verify" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailStep("collect")
                        setEmailOtp("")
                        resetMessages()
                      }}
                      className="rounded-xl border border-border px-4 py-3 font-medium transition-colors hover:bg-muted"
                    >
                      Change email
                    </button>
                  )}
                </div>
              </form>
            )}

            {activeMethod === "form" && (
              <form className="space-y-4" onSubmit={handleFormSignup}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={event => setUsername(event.target.value)}
                    autoComplete="username"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                    placeholder="admin-user"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Gmail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    autoComplete="email"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                    placeholder="admin@gmail.com"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                    placeholder="Create a password"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Confirm password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                    placeholder="Confirm your password"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? "Creating account..." : "Create admin account"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
