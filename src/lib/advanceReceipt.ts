import { jsPDF } from 'jspdf'
import { formatCurrency } from './retail'
import type { AdvanceOrder } from '../services/advanceOrderService'
import { formatPhoneDisplay } from './phone'
import { DOCUMENT_COLORS, drawBrandFooter, drawBrandHeader, loadCanonicalDocumentLogo } from './documentBrand'

export async function advanceReceiptPdf(order: AdvanceOrder) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await loadCanonicalDocumentLogo()
  let y = drawBrandHeader(doc, logo, {
    title: 'Advance Receipt', documentNo: order.deposit_id,
    date: new Date(order.created_at).toLocaleDateString('en-IN'), payment: 'Advance payment',
  })
  doc.setTextColor(DOCUMENT_COLORS.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(`Created: ${new Date(order.created_at).toLocaleString('en-IN')}`, 194, y - 4, { align: 'right' })
  const rows = [
    ['Customer', order.customer_name], ['Phone', formatPhoneDisplay(order.phone)], ['Address', order.address || '-'], ['Product', order.product_name],
    ['Category', order.category || '-'], ['Expected delivery', new Date(`${order.expected_delivery_date}T00:00:00`).toLocaleDateString('en-IN')],
  ]
  y += 8
  rows.forEach(([label, value]) => { doc.setFont('helvetica', 'bold'); doc.setTextColor(DOCUMENT_COLORS.muted); doc.text(label.toUpperCase(), 16, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(DOCUMENT_COLORS.ink); doc.text(String(value), 64, y, { maxWidth: 126 }); y += 9 })
  y += 4; doc.setFillColor(DOCUMENT_COLORS.soft); doc.roundedRect(16, y, 178, 42, 3, 3, 'F')
  const money = [[ 'Total order amount', order.total_amount ], [ 'Deposit paid', order.deposit_amount ], [ 'Remaining balance', order.remaining_balance ]] as const
  money.forEach(([label, value], index) => { const rowY = y + 11 + index * 11; doc.setFont('helvetica', index === 2 ? 'bold' : 'normal'); doc.setTextColor(index === 2 ? DOCUMENT_COLORS.primary : DOCUMENT_COLORS.ink); doc.text(label, 22, rowY); doc.text(formatCurrency(value), 188, rowY, { align: 'right' }) })
  doc.setFont('helvetica', 'bold'); doc.setTextColor(DOCUMENT_COLORS.discount); doc.setFontSize(9); doc.text('This receipt records an advance payment only. It is not a final invoice.', 105, y + 55, { align: 'center' })
  drawBrandFooter(doc, 'THANK YOU FOR CHOOSING PURPLE BOUTIQUE')
  return new File([doc.output('blob')], `Advance-Receipt-${order.deposit_id}.pdf`, { type: 'application/pdf' })
}

/** Print the same canonical A4 receipt PDF that is offered for download. */
export function printAdvanceReceipt(order: AdvanceOrder) {
  void printPdfFile(advanceReceiptPdf(order))
}

export async function printPdfFile(file: File | Promise<File>) {
  const resolved = await file
  const url = URL.createObjectURL(resolved)
  const frame = document.createElement('iframe')
  frame.title = resolved.name
  frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;border:0;right:0;bottom:0'
  frame.src = url
  document.body.appendChild(frame)
  frame.addEventListener('load', () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    setTimeout(() => { frame.remove(); URL.revokeObjectURL(url) }, 1000)
  }, { once: true })
}

export async function downloadFile(file: File | Promise<File>) { const resolved = await file; const url = URL.createObjectURL(resolved); const link = document.createElement('a'); link.href = url; link.download = resolved.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 500) }

