import type { jsPDF } from 'jspdf'
import { BRAND_ADDRESS, BRAND_EMAIL, BRAND_EN, BRAND_LOGO, BRAND_PHONE_DISPLAY } from './brand'

export const DOCUMENT_COLORS = {
  primary: '#5a3928',
  ink: '#18202a',
  muted: '#68717c',
  soft: '#f7f1eb',
  line: '#d8dce0',
  tableLine: '#e8eaed',
  discount: '#b45309',
} as const

export function assertBusinessContactConfigured() {
  if (!BRAND_PHONE_DISPLAY) {
    throw new Error('Specson phone is not configured. Set VITE_BUSINESS_PHONE before generating documents.')
  }
}

export async function loadCanonicalDocumentLogo(): Promise<string> {
  assertBusinessContactConfigured()
  const response = await fetch(BRAND_LOGO)
  if (!response.ok) throw new Error(`Unable to load document logo (${response.status})`)
  const blob = await response.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('Unable to read document logo'))
    reader.readAsDataURL(blob)
  })
}

export function drawBrandHeader(
  doc: jsPDF,
  logoDataUrl: string,
  options: { title: string; documentNo: string; date: string; payment?: string },
) {
  const left = 16
  const right = 194
  const logoX = left
  const logoY = 20
  const logoSize = 24

  doc.setDrawColor(DOCUMENT_COLORS.line)
  doc.setLineWidth(0.25)
  doc.line(left, 51, right, 51)
  doc.addImage(logoDataUrl, logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG', logoX, logoY, logoSize, logoSize)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(DOCUMENT_COLORS.primary)
  doc.text(BRAND_EN, 46, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(DOCUMENT_COLORS.muted)
  if (BRAND_PHONE_DISPLAY) doc.text(`Phone: ${BRAND_PHONE_DISPLAY}`, 46, 35)
  if (BRAND_ADDRESS) doc.text(BRAND_ADDRESS, 46, 41, { maxWidth: 92 })
  if (BRAND_EMAIL) doc.text(BRAND_EMAIL, 46, 47, { maxWidth: 92 })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(DOCUMENT_COLORS.primary)
  doc.text(options.title.toUpperCase(), right, 27, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(DOCUMENT_COLORS.muted)
  doc.text(`Document No: ${options.documentNo}`, right, 35, { align: 'right' })
  doc.text(`Date: ${options.date}`, right, 41, { align: 'right' })
  if (options.payment) doc.text(`Payment: ${options.payment}`, right, 47, { align: 'right' })
  return 61
}

export function drawBrandFooter(doc: jsPDF, text = 'THANK YOU FOR SHOPPING WITH US') {
  const y = 275
  doc.setDrawColor(DOCUMENT_COLORS.line)
  doc.setLineWidth(0.25)
  doc.line(16, y, 194, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(DOCUMENT_COLORS.primary)
  doc.text(text, 105, y + 8, { align: 'center' })
}
