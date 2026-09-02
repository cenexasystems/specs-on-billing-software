import { businessConfig } from '../constants/business'
import { formatPhoneDisplay } from './phone'

export const BRAND_EN = businessConfig.name
export const BRAND_TA = businessConfig.name
export const BRAND_SUBTITLE = 'Billing & Operations'
export const BRAND_LOGO = businessConfig.logo

const BRAND_PHONE_SOURCE = businessConfig.phone || businessConfig.whatsapp
export const BRAND_PRIMARY_PHONE_DISPLAY = formatPhoneDisplay(BRAND_PHONE_SOURCE) || BRAND_PHONE_SOURCE
export const BRAND_PRIMARY_PHONE_E164 = BRAND_PHONE_SOURCE.replace(/\D/g, '')
export const BRAND_SECONDARY_PHONE_DISPLAY = BRAND_PRIMARY_PHONE_DISPLAY
export const BRAND_SECONDARY_PHONE_E164 = BRAND_PRIMARY_PHONE_E164
export const BRAND_THIRD_PHONE_DISPLAY = BRAND_PRIMARY_PHONE_DISPLAY
export const BRAND_THIRD_PHONE_E164 = BRAND_PRIMARY_PHONE_E164
export const BRAND_PHONE_DISPLAY = BRAND_PRIMARY_PHONE_DISPLAY
export const BRAND_PHONE_E164 = BRAND_PRIMARY_PHONE_E164
export const BRAND_WHATSAPP = BRAND_THIRD_PHONE_DISPLAY
export const WHATSAPP_NUM = BRAND_THIRD_PHONE_E164
export const BRAND_WHATSAPP_LINK = `https://wa.me/${BRAND_THIRD_PHONE_E164}`
export const BRAND_EMAIL = businessConfig.email
export const BRAND_ADDRESS = businessConfig.address
export const BRAND_LOCATION_LINK = '#'
