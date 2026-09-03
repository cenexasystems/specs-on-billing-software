/**
 * SpecsOn admin login — configurable via Vercel environment variables
 */
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { User, Lock } from 'lucide-react'
import { useAuthStore, type AuthUser } from '../store/store'
import { BRAND_EN, BRAND_TA, BRAND_LOGO } from '../lib/brand'

const MISSING_CONFIG_MESSAGE =
  'Login configuration is missing. Configure VITE_USERNAME and VITE_PASSWORD in the deployment environment.'

export default function Login() {
  const location = useLocation()
  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/'
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || redirectPath || '/dashboard'

  const envUsername = import.meta.env.VITE_USERNAME
  const envPassword = import.meta.env.VITE_PASSWORD
  const isConfigMissing = !envUsername?.trim() || !envPassword?.trim()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(isConfigMissing ? MISSING_CONFIG_MESSAGE : '')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const setAuth = useAuthStore((state) => state.setAuth)

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (isConfigMissing) {
      setError(MISSING_CONFIG_MESSAGE)
      return
    }

    const trimmedUsername = username.trim()
    const enteredPassword = password

    if (!trimmedUsername || !enteredPassword) {
      setError('Enter your username and password.')
      return
    }

    setLoading(true)

    const expectedUsername = String(envUsername).trim()
    const expectedPassword = String(envPassword)

    const isMatch =
      (trimmedUsername === expectedUsername ||
        trimmedUsername.toLowerCase() === expectedUsername.toLowerCase()) &&
      (enteredPassword === expectedPassword || enteredPassword.trim() === expectedPassword.trim())

    if (!isMatch) {
      setError('Invalid credentials')
      setLoading(false)
      return
    }

    const adminUser: AuthUser = {
      id: 'admin',
      name: expectedUsername || 'Admin',
      email: '',
      role: 'admin',
    }

    setAuth(adminUser)
    window.history.replaceState(null, '', window.location.href)
    window.location.assign(from === '/' ? '/dashboard' : from)
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-br from-[#eaf2e5] to-[#fbf8f2] min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-sand/40 w-full max-w-md">

        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-white border border-gray-200 p-2 shadow-md">
            <img src={BRAND_LOGO} alt={`${BRAND_EN} logo`} className="h-12 w-auto max-w-[150px] rounded-xl object-contain" />
          </div>
          <h1 className="text-xl font-bold font-headline text-textMain text-center">{BRAND_EN}</h1>
          <p className="text-[12px] text-textMuted mt-0.5 text-center">{BRAND_TA}</p>
          {redirectPath !== '/' && (
            <p className="mt-2.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Sign in to continue
            </p>
          )}
        </div>

        {/* Server-level error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-[12px] mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
          <p className="text-[13px] font-bold text-textMain">Sign in to the billing workspace</p>
          <FieldGroup label="Username" icon={<User size={14} />} required>
            <input
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              className={inputCls(false)}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Password" icon={<Lock size={14} />} required>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              className={inputCls(false)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldGroup>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5a3928] hover:bg-[#3f281d] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner /> Signing in…</> : <><Lock size={15} /> Sign in</>}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Module-level helpers ─────────────────────────────────────────── */

const inputCls = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-xl border-2 outline-none text-[13px] transition-colors ${
    hasError
      ? 'border-red-400 focus:border-red-500 bg-red-50/30'
      : 'border-sand focus:border-sageDark'
  }`

function FieldGroup({
  label, icon, required, error, hint, children,
}: {
  label: string
  icon: React.ReactNode
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-textMuted uppercase tracking-wide mb-1.5">
        {icon}
        {label}
        {required && <span className="text-red-500 font-black">*</span>}
        {hint && <span className="ml-auto font-normal normal-case text-[10px] text-gray-400">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-500 font-medium flex items-center gap-1">
          <span className="shrink-0">⚠ </span> {error}
        </p>
      )}
    </div>
  )
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
}
