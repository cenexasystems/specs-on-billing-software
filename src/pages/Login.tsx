/**
 * Purple Boutique admin login — Supabase email/password authentication
 */
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, User, Phone as PhoneIcon, Lock } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/store'
import { BRAND_EN, BRAND_TA, BRAND_LOGO } from '../lib/brand'
import { isValidPhone, getSubscriberDigits } from '../lib/phone'
import { useLangStore } from '../store/langStore'

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  window.location.origin

type EmailStep = 'input' | 'sent'

interface FieldError {
  name?: string
  phone?: string
  email?: string
}

function validate(name: string, phone: string, email: string): FieldError {
  const errs: FieldError = {}
  if (!name.trim() || name.trim().length < 2)
    errs.name = 'Please enter your full name (at least 2 characters).'
  if (!isValidPhone(phone))
    errs.phone = 'Enter a valid Indian mobile number (e.g. 9876543210 or +91 9876543210).'
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errs.email = 'Enter a valid email address.'
  return errs
}

export default function Login() {
  const location   = useLocation()
  const { lang } = useLangStore()
  const l = (en: string, ta: string) => lang === 'ta' ? ta : en
  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/'
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || redirectPath || '/dashboard'

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [fieldErrs, setFieldErrs] = useState<FieldError>({})
  const [email,     setEmail]     = useState('')
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [emailStep, setEmailStep] = useState<EmailStep>('input')
  const [passwordMode, setPasswordMode] = useState(true)
  const [password, setPassword] = useState('')
  const setAuth = useAuthStore((state) => state.setAuth)

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Enter your username and password.'); return }
    setLoading(true)
    const result = await authService.signIn(email.trim(), password)
    if (result.error || !result.user) {
      setError(result.error || 'Invalid email or password.')
    } else if (result.user.role !== 'admin') {
      await authService.signOut()
      setError('This account is not authorized for the billing workspace.')
    } else {
      setAuth(result.user)
      window.history.replaceState(null, '', window.location.href)
      window.location.assign(from === '/' ? '/dashboard' : from)
    }
    setLoading(false)
  }

  /* ── Email: send magic link ──────────────────────────────────── */
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const rawErrs = validate(name, phone, email)
    if (Object.keys(rawErrs).length > 0) {
      setFieldErrs({
        name:  rawErrs.name  ? l('Please enter your full name (at least 2 characters).', 'உங்?•ள் முழு பெயரை உள்ளிடவும் (?•ுறைந்தது 2 எழுத்து?•்?•ள்).') : undefined,
        phone: rawErrs.phone ? l('Enter a valid Indian mobile number (e.g. 9876543210).', 'சரியா?© இந்திய மொபைல் எண் உள்ளிடவும்.') : undefined,
        email: rawErrs.email ? l('Enter a valid email address.', 'சரியா?© மி?©்?©ஞ்சல் உள்ளிடவும்.') : undefined,
      })
      return
    }
    if (!isSupabaseConfigured) { setError('Authentication not configured.'); return }

    setLoading(true); setError(''); setFieldErrs({})
    const subscriberDigits = getSubscriberDigits(phone) ?? ''
    const { error: e2 } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: SITE_URL,
        data: { name: name.trim(), full_name: name.trim(), mobile: subscriberDigits },
      },
    })
    setLoading(false)
    if (e2) { setError(e2.message); return }
    setEmailStep('sent')
  }

  /* ── Render ───────────────────────────────────────────────────── */
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

        {/* ?•??•??•? EMAIL — step 1: form ?•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•? */}
        {emailStep === 'input' && passwordMode && (
          <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
            <p className="text-[13px] font-bold text-textMain">Sign in to the billing workspace</p>
            <FieldGroup label="Username" icon={<User size={14} />} required>
              <input type="text" autoComplete="username" placeholder="admin or email" className={inputCls(false)} value={email} onChange={e => setEmail(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Password" icon={<Lock size={14} />} required>
              <input type="password" autoComplete="current-password" placeholder="Your password" className={inputCls(false)} value={password} onChange={e => setPassword(e.target.value)} />
            </FieldGroup>
            <button type="submit" disabled={loading} className="w-full bg-[#5a3928] hover:bg-[#3f281d] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Spinner /> Signing in…</> : <><Lock size={15} /> Sign in</>}
            </button>
          </form>
        )}

        {emailStep === 'input' && !passwordMode && (
          <form onSubmit={handleSendLink} noValidate className="space-y-4">
            <p className="text-[13px] font-bold text-textMain">{l('Sign in with Email', 'மி?©்?©ஞ்சல் மூலம் உள்நுழைவு')}</p>

            {/* Full Name */}
            <FieldGroup label={l('Full Name', 'முழு பெயர்')} icon={<User size={14} />} required error={fieldErrs.name}>
              <input
                type="text" autoComplete="name"
                placeholder="e.g. Priya Krishnamurthy"
                className={inputCls(!!fieldErrs.name)}
                value={name}
                onChange={e => { setName(e.target.value); setFieldErrs(f => ({ ...f, name: '' })) }}
              />
            </FieldGroup>

            {/* Mobile Number */}
            <FieldGroup label={l('Mobile Number', 'மொபைல் எண்')} icon={<PhoneIcon size={14} />} required error={fieldErrs.phone} hint={l('10-digit Indian mobile', '10 இல?•்?• மொபைல்')}>
              <div className="flex gap-2">
                <span className="flex items-center px-3 py-3 bg-[#fbf8f2] border-2 border-sand rounded-xl text-[13px] font-bold text-textMuted shrink-0 select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel" autoComplete="tel-national"
                  placeholder="9876543210 or +91 9876543210"
                  className={`flex-1 ${inputCls(!!fieldErrs.phone)}`}
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setFieldErrs(f => ({ ...f, phone: '' })) }}
                />
              </div>
            </FieldGroup>

            {/* Email */}
            <FieldGroup label={l('Email Address', 'மி?©்?©ஞ்சல் மு?•வரி')} icon={<Mail size={14} />} required error={fieldErrs.email}>
              <input
                type="email" autoComplete="email"
                placeholder="you@example.com"
                className={inputCls(!!fieldErrs.email)}
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldErrs(f => ({ ...f, email: '' })) }}
              />
            </FieldGroup>

            <button type="submit" disabled={loading}
              className="w-full bg-sageDark hover:bg-sageDeep text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><Spinner /> {l('Sending link…', '?…?©ுப்பு?•ிறது...')}</>
                : <><Mail size={15} /> {l('Send Magic Link', 'இணைப்பு ?…?©ுப்பு')}</>
              }
            </button>

            <p className="text-center text-[11px] text-gray-400 leading-relaxed">
              We'll send a one-click sign-in link to your inbox.<br />
              No password needed. Works for sign-up and sign-in.
            </p>

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-sand/60" />
              <span className="text-[11px] text-textMuted font-medium shrink-0">{l('or', '?…ல்லது')}</span>
              <div className="flex-1 h-px bg-sand/60" />
            </div>

            <button type="button" onClick={() => setPasswordMode(true)} className="w-full text-[11px] font-semibold text-textMuted hover:text-textMain">Use email and password</button>
          </form>
        )}

        {/* ?•??•??•? EMAIL — step 2: link sent ?•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•??•? */}
        {emailStep === 'sent' && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-textMain text-[15px] mb-1">{l('Check your inbox!', 'உங்?•ள் inbox பாருங்?•ள்!')}</h3>
              <p className="text-[13px] text-textMuted leading-relaxed">
                A magic sign-in link was sent to<br />
                <strong className="text-sageDark">{email}</strong>
              </p>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Click the link to sign in instantly.<br />
              Valid for 60 minutes. Check spam if not received.
            </p>

            <button type="button"
              onClick={() => { setEmailStep('input'); setError('') }}
              className="flex items-center justify-center gap-1.5 text-[12px] text-textMuted hover:text-textMain mx-auto">
              <ArrowLeft size={13} /> {l('Use a different email', 'வேறு மி?©்?©ஞ்சல்')}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-sand/50 text-center">
          <p className="text-[11px] text-gray-400">
            {l('First time here? Your account is created automatically on sign-in.', 'முதல் முறையா? உள்நுழைவில் ?•ண?•்?•ு தா?©ா?• உருவா?•ும்.')}
          </p>
        </div>
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
          <span className="shrink-0">? </span> {error}
        </p>
      )}
    </div>
  )
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
}

