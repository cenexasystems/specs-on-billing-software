export type TaxSettings = { enabled: boolean; rate: number; label: string }

export type BusinessConfig = {
  name: string
  legalName: string
  ownerName: string
  logo: string
  favicon: string
  phone: string
  whatsapp: string
  email: string
  address: string
  currency: string
  locale: string
  taxSettings: TaxSettings
  invoicePrefix: string
  receiptFooter: string
  invoiceFooter: string
  theme: { primary: string; accent: string }
}

const env = (key: string, fallback: string) => (import.meta.env[key] as string | undefined)?.trim() || fallback

export const businessConfig: BusinessConfig = {
  name: env('VITE_BUSINESS_NAME', 'Purple Boutique'),
  legalName: env('VITE_BUSINESS_LEGAL_NAME', 'Purple Boutique'),
  ownerName: env('VITE_BUSINESS_OWNER', ''),
  logo: env('VITE_BUSINESS_LOGO', '/purple-boutique-logo.svg'),
  favicon: env('VITE_BUSINESS_FAVICON', '/purple-boutique-mark.svg'),
  phone: env('VITE_BUSINESS_PHONE', ''),
  whatsapp: env('VITE_WHATSAPP_NUMBER', ''),
  email: env('VITE_BUSINESS_EMAIL', ''),
  address: env('VITE_BUSINESS_ADDRESS', ''),
  currency: env('VITE_CURRENCY', 'INR'),
  locale: env('VITE_LOCALE', 'en-IN'),
  taxSettings: {
    enabled: env('VITE_TAX_ENABLED', 'false') === 'true',
    rate: Number(env('VITE_TAX_RATE', '0')) || 0,
    label: env('VITE_TAX_LABEL', 'Tax'),
  },
  invoicePrefix: env('VITE_INVOICE_PREFIX', 'INV'),
  receiptFooter: env('VITE_RECEIPT_FOOTER', 'Thank you for choosing Purple Boutique.'),
  invoiceFooter: env('VITE_INVOICE_FOOTER', 'Thank you for choosing Purple Boutique.'),
  theme: {
    primary: env('VITE_THEME_PRIMARY', '#4f46e5'),
    accent: env('VITE_THEME_ACCENT', '#0f766e'),
  },
}

export const BUSINESS_PHONE = businessConfig.phone
export const BUSINESS_PHONE_DISPLAY = businessConfig.phone
export const BUSINESS_WHATSAPP_LINK = businessConfig.whatsapp ? `https://wa.me/${businessConfig.whatsapp}` : '#'
