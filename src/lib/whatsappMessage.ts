import { formatInvoiceNo } from './retail'
import { businessConfig } from '../constants/business'

export type WhatsAppLineItem = {
  name: string
  qty: number
  unit: string
  unitType: 'unit' | 'weight' | 'volume' | 'bundle'
  rate: number
  lineTotal: number
}

export type BuildWhatsAppMessageInput = {
  customerName?: string
  phone?: string
  invoiceNumber: string
  invoiceDate?: string
  invoiceUrl?: string
  paymentMode?: string
  items?: WhatsAppLineItem[]
  subtotal?: number
  couponDiscount?: number
  manualDiscountAmount?: number
  shipping?: number
  gstAmount?: number
  total?: number
}

export type AdvanceDepositWhatsAppInput = {
  customerName?: string
  depositId: string
  productName: string
  totalAmount: number
  depositAmount: number
  remainingBalance: number
  expectedDeliveryDate: string
  paymentMethod?: string
}

export const publicInvoiceUrl = (invoiceNumber: string) => {
  const formatted = formatInvoiceNo(invoiceNumber)
  const origin =
    (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}/invoice/${encodeURIComponent(formatted)}`
}

const money = (value: number) => `\u20B9${Number(value || 0).toFixed(2)}`
const BRAND_EN = businessConfig.name

export const buildProfessionalWhatsAppMessage = (input: BuildWhatsAppMessageInput) => {
  const customerName = input.customerName?.trim() || 'Valued Customer'
  const invoiceUrl = input.invoiceUrl || publicInvoiceUrl(input.invoiceNumber)
  const formattedNo = formatInvoiceNo(input.invoiceNumber)
  const itemsText = input.items && input.items.length > 0
    ? input.items.map(item => `- ${item.name} (x${item.qty}) - ${money(item.lineTotal)}`).join('\n')
    : ''

  return `*${BRAND_EN}*
*Official Purchase Invoice & Receipt*

Dear ${customerName},

Thank you for shopping with ${BRAND_EN}! We truly appreciate your order.

*INVOICE DETAILS*
*Invoice No:* #${formattedNo}
${input.invoiceDate ? `*Date:* ${new Date(input.invoiceDate).toLocaleDateString('en-IN')}\n` : ''}${input.paymentMode ? `*Payment Mode:* ${input.paymentMode}\n` : ''}${input.total !== undefined ? `*Total Amount:* ${money(input.total)}\n` : ''}
${itemsText ? `*ITEMS ORDERED:*\n${itemsText}\n\n` : ''}*View & Download Digital Invoice / PDF:*
${invoiceUrl}

Thank you, and we hope to see you again soon!
Thank you!`
}

export const buildAdvanceDepositWhatsAppMessage = (input: AdvanceDepositWhatsAppInput) => {
  const customerName = input.customerName?.trim() || 'Valued Customer'
  const deliveryDateFormatted = input.expectedDeliveryDate
    ? (() => {
        try {
          return new Date(`${input.expectedDeliveryDate}T00:00:00`).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        } catch {
          return input.expectedDeliveryDate
        }
      })()
    : '-'

  return `Thank You for Your Advance Order with ${BRAND_EN}!

Dear ${customerName},

Thank you for choosing ${BRAND_EN}. We have successfully received your initial advance payment!

Advance Deposit Details
Deposit ID: ${input.depositId}
Product: ${input.productName}
Total Order Amount: ${money(input.totalAmount)}
Advance Paid: ${money(input.depositAmount)}${input.paymentMethod ? ` (${input.paymentMethod.toLowerCase() === 'upi' ? 'QR' : input.paymentMethod.toUpperCase()})` : ''}
Balance to Pay on Delivery: ${money(input.remainingBalance)}
Expected Delivery Date: ${deliveryDateFormatted}

Your order preparation is now underway. We will have everything ready on or before ${deliveryDateFormatted} for final payment and delivery or pickup.

Thank you for paying the initial amount as advance!
Thank you!`
}

export const BUSINESS_PHONE = businessConfig.phone
