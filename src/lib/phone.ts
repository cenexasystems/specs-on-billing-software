export type NormalizedIndianPhone = { countryCode: '+91'; phoneNumber: string }

export type PhoneParts = { countryCode: string; phoneNumber: string }

/** Normalize Indian phone input without ever treating it as a number. */
export function normalizeIndianPhone(input: string): NormalizedIndianPhone | null {
  if (!input) return null
  const raw = input.replace(/\D/g, '')
  if (!raw) return null
  let subscriber = raw
  if (raw.length === 12 && raw.startsWith('91')) subscriber = raw.slice(2)
  else if (raw.length === 11 && raw.startsWith('0')) subscriber = raw.slice(1)
  if (!/^[6-9]\d{9}$/.test(subscriber)) return null
  return { countryCode: '+91', phoneNumber: subscriber }
}

/** Backward-compatible canonical value: subscriber/mobile digits only. */
export function normalizePhone(input: string): string | null {
  return normalizeIndianPhone(input)?.phoneNumber ?? null
}

/** Resolve stored split fields first, falling back to a legacy value safely. */
export function normalizePhoneParts(countryCode: string | null | undefined, phoneNumber: string | null | undefined, legacyValue = ''): PhoneParts | null {
  const subscriber = normalizePhone(String(phoneNumber || legacyValue))
  if (!subscriber) return null
  const normalizedCountry = String(countryCode || '+91').replace(/\s/g, '')
  return { countryCode: normalizedCountry === '91' ? '+91' : normalizedCountry, phoneNumber: subscriber }
}

export function phonePartsFromRecord(record: Record<string, unknown>, legacyKey: 'phone' | 'mobile' = 'phone'): PhoneParts | null {
  const countryKey = legacyKey === 'mobile' ? 'mobile_country_code' : 'phone_country_code'
  const numberKey = legacyKey === 'mobile' ? 'mobile_number' : 'phone_number'
  return normalizePhoneParts(
    typeof record[countryKey] === 'string' ? record[countryKey] as string : undefined,
    typeof record[numberKey] === 'string' ? record[numberKey] as string : undefined,
    typeof record[legacyKey] === 'string' ? record[legacyKey] as string : '',
  )
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null
}

export function getSubscriberDigits(input: string): string | null {
  return normalizeIndianPhone(input)?.phoneNumber ?? null
}

export function formatPhoneDisplay(phone: string, countryCode = '+91'): string {
  const normalized = normalizeIndianPhone(phone)
  if (normalized) return `${normalized.countryCode} ${normalized.phoneNumber}`
  const value = String(phone || '').trim()
  return value ? `${countryCode} ${value}` : ''
}

export function normalizePhoneForWhatsApp(input: string): string {
  if (!input) return ''
  const normalized = normalizeIndianPhone(input)
  return normalized ? `91${normalized.phoneNumber}` : input.replace(/\D/g, '')
}

export function toWhatsAppUrl(phone: string, text?: string): string {
  const normalized = normalizePhoneForWhatsApp(phone) || normalizePhone(phone)
  const queryParams: string[] = []

  if (normalized) {
    queryParams.push(`phone=${normalized}`)
  }
  if (text) {
    queryParams.push(`text=${encodeURIComponent(text)}`)
  }

  return `https://api.whatsapp.com/send${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`
}
