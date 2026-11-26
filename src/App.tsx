import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ForwardRefExoticComponent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import DatePickerModule, { type CalendarProps, type DatePickerProps } from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persianFa from 'react-date-object/locales/persian_fa'
import './App.css'

// Vite wraps this CommonJS package's exports, so render its nested React component.
type PersianDatePickerProps = Omit<CalendarProps, 'onChange'> & DatePickerProps
const DatePicker = (DatePickerModule as unknown as { default: ForwardRefExoticComponent<PersianDatePickerProps> }).default

type Role = 'user' | 'operator' | 'admin'
type ServiceView = 'categories' | 'all'
type Theme = 'light' | 'dark'
const siteStyleOptions = [
  { id: 'simple', label: 'ساده', description: 'سطح‌های تمیز با مرزبندی ظریف و بدون سایهٔ نئومورفیک.' },
  { id: 'glass', label: 'شیشه‌ای ساده', description: 'سطح‌های شفاف با تاری پس‌زمینه و ظاهر شیشه‌ای.' },
  { id: 'raised', label: 'برجسته', description: 'سطح‌ها با سایه از پس‌زمینه بیرون می‌آیند.' },
  { id: 'inset', label: 'فرورفته', description: 'سایه‌ها به داخل سطح‌ها هدایت می‌شوند.' },
  { id: 'flat', label: 'تخت', description: 'سطح‌های ساده با کمترین عمق و سایه.' },
  { id: 'concave', label: 'مقعر', description: 'گرادیان و سایهٔ داخلی حس فرورفتگی می‌سازد.' },
  { id: 'convex', label: 'محدب', description: 'گرادیان و سایهٔ بیرونی حس برآمدگی می‌سازد.' },
  { id: 'colored', label: 'رنگی', description: 'سایه‌ها و سطح‌ها با رنگ تأکیدی هماهنگ‌اند.' },
] as const
type SiteStyle = typeof siteStyleOptions[number]['id']
type AdminSettingsSection = 'profile' | 'catalog' | 'events' | 'appearance'
type AppearanceTab = 'site' | 'header'
type AppearanceStyleGroup = 'simple' | 'neumorphic'
type CatalogCategory = { id: string; name: string; description: string; icon?: string }
type CatalogService = { id: string; categoryId: string; name: string; description: string; price: number; icon?: string }
type ServiceCatalogData = { categories: CatalogCategory[]; services: CatalogService[] }
type CartItem = { serviceId: string; categoryName: string; name: string; description: string; price: number; quantity: number }
type DemoAttachment = { name: string; type: string; size: number; dataUrl?: string }
type DemoMessage = { id: string; senderRole: 'user' | 'operator'; senderName: string; text: string; createdAt: string; attachment?: DemoAttachment }
type DemoAdditionalService = { id: string; item: CartItem; status: 'pending' | 'processing' | 'paid' | 'failed'; createdAt: string }
type DemoOrder = {
  id: string
  userId: string
  userName: string
  operatorId: string
  operatorName: string
  items: CartItem[]
  totalPrice: number
  status: string
  conversationStatus?: 'open' | 'closed'
  cancellationFee?: number
  refundAmount?: number
  createdAt: string
  messages: DemoMessage[]
  additionalServices?: DemoAdditionalService[]
}
type AppEvent = { id: string; title: string; startDate: string; endDate: string; categoryId?: string; serviceId?: string }
type AdminUserGender = 'female' | 'male' | 'undisclosed'
type AdminUser = { id: string; fullName: string; phone: string; nationalCode: string; birthDate?: string; gender?: AdminUserGender; isOnline: boolean }
type StoredAdminUser = Omit<AdminUser, 'isOnline'> & { isOnline?: boolean }
type NewAdminUser = Omit<AdminUser, 'id' | 'isOnline'>

const catalogStorageKey = 'xcafinet-service-catalog-rial'
const legacyCatalogStorageKey = 'xcafinet-service-catalog'
const cartStorageKey = 'xcafinet-cart-rial'
const legacyCartStorageKey = 'xcafinet-cart'
const eventsStorageKey = 'xcafinet-events'
const adminUsersStorageKey = 'xcafinet-admin-users'
const adminOperatorsStorageKey = 'xcafinet-admin-operators'
const demoOrdersStorageKey = 'xcafinet-demo-orders'
const demoUserId = 'demo-user-negar'
const demoUserName = 'نگار محمدی'
const demoUserPhone = '۰۹۱۲ ۳۴۵ ۶۷۸۹'
const demoWalletInitialBalance = 24_800_000
const demoOperators = [{ id: 'demo-operator-sara', fullName: 'سارا احمدی', isAvailable: true }]
const maxDemoDocumentSize = 2 * 1024 * 1024
const maxBirthDate = new Date()
const themeStorageKey = 'xcafinet-theme'
const siteStyleStorageKey = 'xcafinet-site-style'
const defaultCatalog: ServiceCatalogData = {
  categories: [
    { id: 'design', name: 'طراحی و برندینگ', description: 'از ایده تا هویت بصری ماندگار' },
    { id: 'web', name: 'توسعه وب‌سایت', description: 'تجربه‌ای حرفه‌ای برای کسب‌وکار تو' },
    { id: 'support', name: 'مشاوره و پشتیبانی', description: 'همراهی در تمام قدم‌های مسیر' },
  ],
  services: [
    { id: 'design-identity', categoryId: 'design', name: 'طراحی هویت بصری', description: 'طراحی یک هویت بصری یکپارچه برای برند شما', price: 14500000 },
    { id: 'web-development', categoryId: 'web', name: 'طراحی و توسعه وب‌سایت', description: 'طراحی وب‌سایت متناسب با نیاز کسب‌وکار شما', price: 38000000 },
    { id: 'customer-support', categoryId: 'support', name: 'مشاوره و پشتیبانی', description: 'همراهی و پاسخ‌گویی به پرسش‌های شما', price: 2800000 },
  ],
}

function isCatalogCategory(value: unknown): value is CatalogCategory {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'name' in value
    && 'description' in value
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && (!('icon' in value) || typeof value.icon === 'string')
}

function isCatalogService(value: unknown): value is CatalogService {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'categoryId' in value
    && 'name' in value
    && 'description' in value
    && 'price' in value
    && typeof value.id === 'string'
    && typeof value.categoryId === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.price === 'number'
    && Number.isSafeInteger(value.price)
    && value.price > 0
    && (!('icon' in value) || typeof value.icon === 'string')
}

function isServiceCatalogData(value: unknown): value is ServiceCatalogData {
  return typeof value === 'object'
    && value !== null
    && 'categories' in value
    && 'services' in value
    && Array.isArray(value.categories)
    && value.categories.every(isCatalogCategory)
    && Array.isArray(value.services)
    && value.services.every(isCatalogService)
}

function tomanToRial(price: number): number {
  const rialPrice = price * 10
  if (!Number.isSafeInteger(rialPrice)) throw new Error('A stored toman price is too large to convert safely.')
  return rialPrice
}

function loadServiceCatalog(): ServiceCatalogData {
  try {
    const currentStored = localStorage.getItem(catalogStorageKey)
    const stored = currentStored ?? localStorage.getItem(legacyCatalogStorageKey)
    if (stored === null) return defaultCatalog

    const parsed: unknown = JSON.parse(stored)
    if (isServiceCatalogData(parsed)) {
      if (currentStored !== null) return parsed
      return {
        ...parsed,
        services: parsed.services.map((service) => ({ ...service, price: tomanToRial(service.price) })),
      }
    }

    console.error('Stored service catalog has an invalid format; using the starter catalog.')
  } catch (error) {
    console.error('Could not load the saved service catalog.', error)
  }

  return defaultCatalog
}

function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1000) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
}

function toPersianDigits(value: string): string {
  return value.replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
}

function formatDemoFileSize(size: number): string {
  if (size < 1024) return `${new Intl.NumberFormat('fa-IR').format(size)} بایت`
  const kilobytes = size / 1024
  return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(kilobytes)} کیلوبایت`
}

function isAdminUser(value: unknown): value is StoredAdminUser {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'fullName' in value
    && 'phone' in value
    && 'nationalCode' in value
    && typeof value.id === 'string'
    && typeof value.fullName === 'string'
    && value.fullName.trim().length > 0
    && typeof value.phone === 'string'
    && value.phone.trim().length > 0
    && typeof value.nationalCode === 'string'
    && /^\d{10}$/.test(normalizeDigits(value.nationalCode))
    && (!('birthDate' in value) || value.birthDate === undefined || isDateOnly(value.birthDate))
    && (!('gender' in value) || value.gender === undefined || value.gender === 'female' || value.gender === 'male' || value.gender === 'undisclosed')
    && (!('isOnline' in value) || typeof value.isOnline === 'boolean')
}

function loadAdminPeople(storageKey: string, storageLabel: string): AdminUser[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored === null) return []

    const parsed: unknown = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.every(isAdminUser)) {
      return parsed.map((user) => ({ ...user, isOnline: false }))
    }

    console.error(`Stored ${storageLabel} have an invalid format; starting with an empty list.`)
  } catch (error) {
    console.error(`Could not load the saved ${storageLabel}.`, error)
  }

  return []
}

function isAppEvent(value: unknown): value is AppEvent {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'title' in value
    && 'startDate' in value
    && 'endDate' in value
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && value.title.trim().length > 0
    && isDateOnly(value.startDate)
    && isDateOnly(value.endDate)
    && value.startDate <= value.endDate
    && (!('categoryId' in value) || typeof value.categoryId === 'string')
    && (!('serviceId' in value) || typeof value.serviceId === 'string')
}

function loadEvents(): AppEvent[] {
  try {
    const stored = localStorage.getItem(eventsStorageKey)
    if (stored === null) return []

    const parsed: unknown = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.every(isAppEvent)) return parsed

    console.error('Stored events have an invalid format; starting with an empty list.')
  } catch (error) {
    console.error('Could not load the saved events.', error)
  }

  return []
}

function dateToIso(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

function formatPersianDate(value: string): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateFromIso(value))
}

function formatPersianDateInput(value: string): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateFromIso(value))
}

function daysUntil(value: string): number {
  const [year, month, day] = value.split('-').map(Number)
  const today = new Date()
  const endDate = Date.UTC(year, month - 1, day)
  const todayDate = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((endDate - todayDate) / 86_400_000)
}

function isCartItem(value: unknown): value is CartItem {
  return typeof value === 'object'
    && value !== null
    && 'serviceId' in value
    && 'categoryName' in value
    && 'name' in value
    && 'description' in value
    && 'price' in value
    && 'quantity' in value
    && typeof value.serviceId === 'string'
    && typeof value.categoryName === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.price === 'number'
    && Number.isSafeInteger(value.price)
    && value.price > 0
    && typeof value.quantity === 'number'
    && Number.isSafeInteger(value.quantity)
    && value.quantity > 0
}

function loadCart(): CartItem[] {
  try {
    const currentStored = localStorage.getItem(cartStorageKey)
    const stored = currentStored ?? localStorage.getItem(legacyCartStorageKey)
    if (stored === null) return []

    const parsed: unknown = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.every(isCartItem)) {
      if (currentStored !== null) return parsed
      return parsed.map((item) => ({ ...item, price: tomanToRial(item.price) }))
    }

    console.error('Stored shopping cart has an invalid format; starting with an empty cart.')
  } catch (error) {
    console.error('Could not load the saved shopping cart.', error)
  }

  return []
}

function isDemoMessage(value: unknown): value is DemoMessage {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'senderRole' in value
    && 'senderName' in value
    && 'text' in value
    && 'createdAt' in value
    && typeof value.id === 'string'
    && (value.senderRole === 'user' || value.senderRole === 'operator')
    && typeof value.senderName === 'string'
    && typeof value.text === 'string'
    && (value.text.trim().length > 0 || ('attachment' in value && isDemoAttachment(value.attachment)))
    && typeof value.createdAt === 'string'
    && !Number.isNaN(Date.parse(value.createdAt))
    && (!('attachment' in value) || value.attachment === undefined || isDemoAttachment(value.attachment))
}

function isDemoAttachment(value: unknown): value is DemoAttachment {
  return typeof value === 'object'
    && value !== null
    && 'name' in value
    && 'type' in value
    && 'size' in value
    && typeof value.name === 'string'
    && typeof value.type === 'string'
    && typeof value.size === 'number'
    && Number.isSafeInteger(value.size)
    && value.size >= 0
    && (!('dataUrl' in value) || value.dataUrl === undefined || (typeof value.dataUrl === 'string' && /^data:[^,]+;base64,[A-Za-z0-9+/]*={0,2}$/.test(value.dataUrl)))
}

function isDemoAdditionalService(value: unknown): value is DemoAdditionalService {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'item' in value
    && 'status' in value
    && 'createdAt' in value
    && typeof value.id === 'string'
    && isCartItem(value.item)
    && (value.status === 'pending' || value.status === 'processing' || value.status === 'paid' || value.status === 'failed')
    && typeof value.createdAt === 'string'
    && !Number.isNaN(Date.parse(value.createdAt))
}

function isDemoOrder(value: unknown): value is DemoOrder {
  return typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'userId' in value
    && 'userName' in value
    && 'operatorId' in value
    && 'operatorName' in value
    && 'items' in value
    && 'totalPrice' in value
    && 'status' in value
    && 'createdAt' in value
    && 'messages' in value
    && typeof value.id === 'string'
    && typeof value.userId === 'string'
    && typeof value.userName === 'string'
    && typeof value.operatorId === 'string'
    && typeof value.operatorName === 'string'
    && Array.isArray(value.items)
    && value.items.length > 0
    && value.items.every(isCartItem)
    && typeof value.totalPrice === 'number'
    && Number.isSafeInteger(value.totalPrice)
    && value.totalPrice > 0
    && typeof value.status === 'string'
    && (!('conversationStatus' in value) || value.conversationStatus === 'open' || value.conversationStatus === 'closed')
    && (!('cancellationFee' in value) || value.cancellationFee === undefined || (typeof value.cancellationFee === 'number' && Number.isSafeInteger(value.cancellationFee) && value.cancellationFee >= 0))
    && (!('refundAmount' in value) || value.refundAmount === undefined || (typeof value.refundAmount === 'number' && Number.isSafeInteger(value.refundAmount) && value.refundAmount >= 0))
    && typeof value.createdAt === 'string'
    && !Number.isNaN(Date.parse(value.createdAt))
    && Array.isArray(value.messages)
    && value.messages.every(isDemoMessage)
    && (!('additionalServices' in value) || (Array.isArray(value.additionalServices) && value.additionalServices.every(isDemoAdditionalService)))
}

function loadDemoOrders(): DemoOrder[] {
  try {
    const stored = localStorage.getItem(demoOrdersStorageKey)
    if (stored === null) return []

    const parsed: unknown = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.every(isDemoOrder)) return parsed

    console.error('Stored demo orders have an invalid format; starting with an empty list.')
  } catch (error) {
    console.error('Could not load the saved demo orders.', error)
  }

  return []
}

function createCatalogId(type: 'category' | 'service') {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createEventId() {
  return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createAdminUserId() {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function createCatalogIcon(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('فایل انتخاب‌شده تصویر نیست.'))
  if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('حجم آیکن نباید بیشتر از ۵ مگابایت باشد.'))

  const imageUrl = URL.createObjectURL(file)

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      try {
        const maxSize = 128
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')
        if (!context) throw new Error('امکان آماده‌سازی آیکن وجود ندارد.')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/webp', .82))
      } catch (error) {
        reject(error instanceof Error ? error : new Error('آیکن بارگذاری نشد.'))
      } finally {
        URL.revokeObjectURL(imageUrl)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error('خواندن تصویر انتخاب‌شده ممکن نیست.'))
    }
    image.src = imageUrl
  })
}

function loadTheme(): Theme {
  try {
    return localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light'
  } catch (error) {
    console.error('Could not load the saved theme preference.', error)
    return 'light'
  }
}

function loadSiteStyle(): SiteStyle {
  try {
    const stored = localStorage.getItem(siteStyleStorageKey)
    const option = siteStyleOptions.find((item) => item.id === stored)
    if (option) return option.id
    if (stored !== null) console.error('Stored site style is invalid; using the raised style.')
  } catch (error) {
    console.error('Could not load the saved site style.', error)
  }

  return 'raised'
}

type IconName =
  | 'home'
  | 'grid'
  | 'calendar'
  | 'wallet'
  | 'user'
  | 'chat'
  | 'settings'
  | 'users'
  | 'check'
  | 'search'
  | 'bell'
  | 'arrow'
  | 'plus'
  | 'more'
  | 'clock'
  | 'chart'
  | 'logout'
  | 'sparkle'
  | 'receipt'
  | 'support'
  | 'cart'
  | 'minus'
  | 'trash'
  | 'download'
  | 'moon'
  | 'sun'
  | 'paperclip'
  | 'close'

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18M16 14h2M6 5V4a2 2 0 0 1 2-2h10" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z" transform="translate(-1 -1)" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chart: <><path d="M3 3v18h18M8 15l4-4 4 3 5-7" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" /></>,
  sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3ZM19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
  receipt: <><path d="M5 3v18l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2-3-2Z" /><path d="M9 9h6M9 13h6" /></>,
  support: <><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2ZM20 13a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2ZM12 21h3" /></>,
  cart: <><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="19" cy="20" r="1" /></>,
  minus: <><path d="M5 12h14" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  moon: <><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  paperclip: <><path d="m8 12.5 6.8-6.8a3.2 3.2 0 0 1 4.5 4.5l-8.5 8.5a5 5 0 0 1-7.1-7.1l8.2-8.2" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
}

function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const nextThemeLabel = theme === 'light' ? 'حالت شب' : 'حالت روز'
  return (
    <button className="theme-toggle-button" type="button" aria-label={`تغییر به ${nextThemeLabel}`} aria-pressed={theme === 'dark'} title={`تغییر به ${nextThemeLabel}`} onClick={onToggle}>
      <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
    </button>
  )
}

const roleLabels: Record<Role, string> = { user: 'کاربر', operator: 'اپراتور', admin: 'مدیریت' }
const navItems: { label: string; icon: IconName }[] = [
  { label: 'خدمات', icon: 'grid' },
  { label: 'رویدادها', icon: 'calendar' },
  { label: 'سبد خرید', icon: 'cart' },
  { label: 'کیف پول', icon: 'wallet' },
  { label: 'حساب کاربری', icon: 'user' },
]
const desktopNavItems: { label: string; icon: IconName }[] = [
  ...navItems.filter((item) => item.label === 'خدمات' || item.label === 'رویدادها'),
  { label: 'درباره ما', icon: 'users' },
  { label: 'تماس با ما', icon: 'support' },
]
const sidebarItems: Record<Role, { label: string; icon: IconName }[]> = {
  admin: [
    { label: 'داشبورد', icon: 'grid' },
    { label: 'کیف پول', icon: 'wallet' },
    { label: 'کاربران', icon: 'users' },
    { label: 'اپراتورها', icon: 'support' },
    { label: 'گفتگوها', icon: 'chat' },
    { label: 'تنظیمات', icon: 'settings' },
  ],
  operator: [
    { label: 'داشبورد', icon: 'grid' },
    { label: 'گفتگوها', icon: 'chat' },
    { label: 'سفارشات انجام‌شده', icon: 'check' },
    { label: 'تنظیمات ظاهری', icon: 'settings' },
  ],
  user: [
    { label: 'داشبورد', icon: 'grid' },
    { label: 'کیف پول', icon: 'wallet' },
    { label: 'سفارشات', icon: 'receipt' },
    { label: 'دانلودها', icon: 'download' },
    { label: 'گفتگوها', icon: 'chat' },
    { label: 'حساب من', icon: 'user' },
    { label: 'تنظیمات ظاهری', icon: 'settings' },
  ],
}

const orders = [
  { id: 'XC-2048', service: 'مشاوره و پشتیبانی', date: 'امروز، ۱۰:۴۲', amount: '۲,۸۰۰,۰۰۰', status: 'در حال انجام', tone: 'purple', initials: 'م' },
  { id: 'XC-2041', service: 'طراحی هویت بصری', date: '۲۵ آبان، ۱۶:۲۰', amount: '۱۴,۵۰۰,۰۰۰', status: 'تکمیل شده', tone: 'green', initials: 'ط' },
  { id: 'XC-2035', service: 'توسعه وب‌سایت', date: '۲۳ آبان، ۰۹:۱۵', amount: '۳۸,۰۰۰,۰۰۰', status: 'تکمیل شده', tone: 'blue', initials: 'و' },
]

function App() {
  const [role, setRole] = useState<Role>('user')
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [siteStyle, setSiteStyle] = useState<SiteStyle>(loadSiteStyle)
  const [activeNav, setActiveNav] = useState('خانه')
  const [serviceView, setServiceView] = useState<ServiceView>('all')
  const [catalog, setCatalog] = useState(loadServiceCatalog)
  const [events, setEvents] = useState(loadEvents)
  const [cart, setCart] = useState(loadCart)
  const [demoOrders, setDemoOrders] = useState(loadDemoOrders)
  const demoWalletBalance = demoOrders.reduce((balance, order) => balance + (order.refundAmount ?? 0), demoWalletInitialBalance)
  const [activeDemoOrderId, setActiveDemoOrderId] = useState<string | null>(null)
  const [requestedServiceId, setRequestedServiceId] = useState<string | null>(null)
  const [cartNotice, setCartNotice] = useState('')
  const [activePage, setActivePage] = useState('داشبورد')
  const [range, setRange] = useState('این هفته')
  const [search, setSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [supportMenuOpen, setSupportMenuOpen] = useState(false)
  const compactSupportMenuRef = useRef<HTMLDivElement>(null)
  const desktopSupportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(catalogStorageKey, JSON.stringify(catalog))
    } catch (error) {
      console.error('Could not save the service catalog.', error)
    }
  }, [catalog])

  useEffect(() => {
    try {
      localStorage.setItem(eventsStorageKey, JSON.stringify(events))
    } catch (error) {
      console.error('Could not save the events.', error)
    }
  }, [events])

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart))
    } catch (error) {
      console.error('Could not save the shopping cart.', error)
    }
  }, [cart])

  useEffect(() => {
    try {
      localStorage.setItem(demoOrdersStorageKey, JSON.stringify(demoOrders))
    } catch (error) {
      console.error('Could not save the demo orders.', error)
    }
  }, [demoOrders])

  useEffect(() => {
    try {
      localStorage.setItem(themeStorageKey, theme)
    } catch (error) {
      console.error('Could not save the theme preference.', error)
    }
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(siteStyleStorageKey, siteStyle)
    } catch (error) {
      console.error('Could not save the site style.', error)
    }
  }, [siteStyle])

  useEffect(() => {
    if (!supportMenuOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && ![compactSupportMenuRef.current, desktopSupportMenuRef.current].some((ref) => ref?.contains(target))) {
        setSupportMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSupportMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [supportMenuOpen])

  const addCategory = (category: CatalogCategory) => {
    setCatalog((current) => ({ ...current, categories: [...current.categories, category] }))
  }

  const updateCategory = (updatedCategory: CatalogCategory) => {
    setCatalog((current) => ({
      ...current,
      categories: current.categories.map((category) => category.id === updatedCategory.id ? updatedCategory : category),
    }))
  }

  const deleteCategory = (categoryId: string) => {
    const serviceIds = new Set(catalog.services.filter((service) => service.categoryId === categoryId).map((service) => service.id))
    setCatalog((current) => ({
      categories: current.categories.filter((category) => category.id !== categoryId),
      services: current.services.filter((service) => service.categoryId !== categoryId),
    }))
    setCart((current) => current.filter((item) => !serviceIds.has(item.serviceId)))
  }

  const addService = (service: CatalogService) => {
    setCatalog((current) => ({ ...current, services: [...current.services, service] }))
  }

  const addEvent = (event: AppEvent) => {
    setEvents((current) => [...current, event])
  }

  const deleteEvent = (eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId))
  }

  const updateService = (updatedService: CatalogService) => {
    setCatalog((current) => ({
      ...current,
      services: current.services.map((service) => service.id === updatedService.id ? updatedService : service),
    }))
    const categoryName = catalog.categories.find((category) => category.id === updatedService.categoryId)?.name
    setCart((current) => current.map((item) => item.serviceId === updatedService.id
      ? { ...item, name: updatedService.name, description: updatedService.description, price: updatedService.price, ...(categoryName ? { categoryName } : {}) }
      : item))
  }

  const deleteService = (serviceId: string) => {
    setCatalog((current) => ({
      ...current,
      services: current.services.filter((service) => service.id !== serviceId),
    }))
    setCart((current) => current.filter((item) => item.serviceId !== serviceId))
  }

  const addToCart = (service: CatalogService, categoryName: string) => {
    setCart((current) => {
      const existing = current.find((item) => item.serviceId === service.id)
      if (existing) {
        return current.map((item) => item.serviceId === service.id ? { ...item, quantity: item.quantity + 1 } : item)
      }

      return [...current, {
        serviceId: service.id,
        categoryName,
        name: service.name,
        description: service.description,
        price: service.price,
        quantity: 1,
      }]
    })
    setCartNotice(`«${service.name}» به سبد خرید اضافه شد.`)
  }

  const changeCartQuantity = (serviceId: string, change: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.serviceId !== serviceId) return [item]
      const quantity = item.quantity + change
      return quantity > 0 ? [{ ...item, quantity }] : []
    }))
  }

  const removeFromCart = (serviceId: string) => {
    setCart((current) => current.filter((item) => item.serviceId !== serviceId))
  }

  const completeDemoPayment = () => {
    if (cart.length === 0) return false
    const assignedOperator = demoOperators.find((operator) => operator.isAvailable)
    if (!assignedOperator) return false

    const now = new Date().toISOString()
    const order: DemoOrder = {
      id: `XC-${Date.now().toString(36).toUpperCase()}`,
      userId: demoUserId,
      userName: demoUserName,
      operatorId: assignedOperator.id,
      operatorName: assignedOperator.fullName,
      items: cart.map((item) => ({ ...item })),
      totalPrice: cart.reduce((total, item) => total + item.price * item.quantity, 0),
      status: 'در حال انجام',
      conversationStatus: 'open',
      createdAt: now,
      messages: [],
      additionalServices: [],
    }
    const nextOrders = [order, ...demoOrders]
    try {
      localStorage.setItem(demoOrdersStorageKey, JSON.stringify(nextOrders))
    } catch (error) {
      console.error('Could not save the demo order.', error)
      setCartNotice('ثبت سفارش آزمایشی انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کنید.')
      return false
    }

    setDemoOrders(nextOrders)
    setCart([])
    setRole('user')
    setActiveDemoOrderId(order.id)
    setActivePage('گفتگوها')
    setActiveNav('حساب کاربری')
    return true
  }

  const updateDemoOrder = (orderId: string, update: (order: DemoOrder) => DemoOrder): boolean => {
    if (!demoOrders.some((order) => order.id === orderId)) {
      console.error(`Could not update missing demo order ${orderId}.`)
      return false
    }

    const nextOrders = demoOrders.map((order) => order.id === orderId ? update(order) : order)
    try {
      localStorage.setItem(demoOrdersStorageKey, JSON.stringify(nextOrders))
    } catch (error) {
      console.error('Could not save the updated demo order.', error)
      return false
    }

    setDemoOrders(nextOrders)
    return true
  }

  const closeDemoConversation = (orderId: string): boolean => {
    const order = demoOrders.find((item) => item.id === orderId)
    if (!order) {
      console.error(`Could not close missing demo conversation ${orderId}.`)
      return false
    }

    if (order.conversationStatus === 'closed') return true

    return updateDemoOrder(orderId, (currentOrder) => ({
      ...currentOrder,
      conversationStatus: 'closed',
    }))
  }

  const cancelDemoOrder = (orderId: string): number | null => {
    const order = demoOrders.find((item) => item.id === orderId)
    if (!order || order.status !== 'در حال انجام') {
      console.error(`Could not cancel inactive demo order ${orderId}.`)
      return null
    }

    const cancellationFee = Math.round(order.totalPrice * 0.25)
    const refundAmount = order.totalPrice - cancellationFee
    if (!Number.isSafeInteger(cancellationFee) || !Number.isSafeInteger(refundAmount) || !Number.isSafeInteger(demoWalletBalance + refundAmount)) {
      console.error('The demo order refund exceeds the supported range.')
      return null
    }

    const saved = updateDemoOrder(orderId, (currentOrder) => ({
      ...currentOrder,
      status: 'لغو شده',
      cancellationFee,
      refundAmount,
    }))
    return saved ? refundAmount : null
  }

  const sendDemoMessage = (orderId: string, text: string, senderRole: 'user' | 'operator', attachment?: DemoAttachment): boolean => {
    const normalizedText = text.trim()
    if (!normalizedText && !attachment) return false

    const order = demoOrders.find((item) => item.id === orderId)
    if (senderRole === 'user' && order?.conversationStatus === 'closed') {
      console.error(`Could not send a user message to closed demo conversation ${orderId}.`)
      return false
    }

    return updateDemoOrder(orderId, (order) => ({
      ...order,
      messages: [...order.messages, {
        id: `message-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        senderRole,
        senderName: senderRole === 'user' ? demoUserName : demoOperators[0].fullName,
        text: normalizedText,
        createdAt: new Date().toISOString(),
        ...(attachment ? { attachment } : {}),
      }],
    }))
  }

  const offerDemoAdditionalService = (orderId: string, item: CartItem): boolean => {
    if (!isCartItem(item)) {
      console.error('Could not add an invalid service to the demo order.')
      return false
    }

    if (!demoOrders.some((order) => order.id === orderId && order.status === 'در حال انجام')) {
      console.error(`Could not add a service to inactive demo order ${orderId}.`)
      return false
    }

    return updateDemoOrder(orderId, (order) => ({
      ...order,
      additionalServices: [...(order.additionalServices ?? []), {
        id: `extra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        item: { ...item },
        status: 'pending',
        createdAt: new Date().toISOString(),
      }],
    }))
  }

  const startDemoAdditionalServicePayment = (orderId: string, serviceId: string): boolean => {
    const order = demoOrders.find((item) => item.id === orderId)
    const service = order?.additionalServices?.find((item) => item.id === serviceId)
    if (!order || order.status !== 'در حال انجام' || !service || (service.status !== 'pending' && service.status !== 'failed')) {
      console.error(`Could not start the additional service payment for order ${orderId}.`)
      return false
    }

    return updateDemoOrder(orderId, (currentOrder) => ({
      ...currentOrder,
      additionalServices: (currentOrder.additionalServices ?? []).map((item) => item.id === serviceId
        ? { ...item, status: 'processing' }
        : item),
    }))
  }

  const completeDemoAdditionalServicePayment = (orderId: string, serviceId: string, successful: boolean): boolean => {
    const order = demoOrders.find((item) => item.id === orderId)
    const service = order?.additionalServices?.find((item) => item.id === serviceId)
    if (!order || order.status !== 'در حال انجام' || !service || service.status !== 'processing') {
      console.error(`Could not finish the additional service payment for order ${orderId}.`)
      return false
    }

    if (!successful) {
      return updateDemoOrder(orderId, (currentOrder) => ({
        ...currentOrder,
        additionalServices: (currentOrder.additionalServices ?? []).map((item) => item.id === serviceId
          ? { ...item, status: 'failed' }
          : item),
      }))
    }

    const price = service.item.price * service.item.quantity
    const totalPrice = order.totalPrice + price
    if (!Number.isSafeInteger(price) || !Number.isSafeInteger(totalPrice)) {
      console.error('The additional service price exceeds the supported range.')
      return false
    }

    const existingItem = order.items.find((item) => item.serviceId === service.item.serviceId)
    if (existingItem && !Number.isSafeInteger(existingItem.quantity + service.item.quantity)) {
      console.error('The additional service quantity exceeds the supported range.')
      return false
    }

    return updateDemoOrder(orderId, (currentOrder) => {
      const currentItems = currentOrder.items
      const currentItem = currentItems.find((item) => item.serviceId === service.item.serviceId)
      const items = currentItem
        ? currentItems.map((item) => item.serviceId === service.item.serviceId
          ? { ...item, quantity: item.quantity + service.item.quantity }
          : item)
        : [...currentItems, { ...service.item }]

      return {
        ...currentOrder,
        items,
        totalPrice: currentOrder.totalPrice + price,
        additionalServices: (currentOrder.additionalServices ?? []).map((item) => item.id === serviceId
          ? { ...item, status: 'paid' }
          : item),
      }
    })
  }

  const openEventService = (serviceId: string) => {
    setRequestedServiceId(serviceId)
    setServiceView('all')
    setServiceSearch('')
    setActiveNav('خدمات')
  }

  const switchRole = (nextRole: Role) => {
    setRole(nextRole)
    setActivePage('داشبورد')
    setActiveNav('حساب کاربری')
    setActiveDemoOrderId(null)
  }

  const openSupportConversations = () => {
    setActiveNav('حساب کاربری')
    setActivePage('گفتگوها')
    setSupportMenuOpen(false)
  }

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light')

  const contentTitle = activeNav === 'خانه' || activeNav === 'حساب کاربری'
    ? activePage
    : activeNav
  const isServices = activeNav === 'خدمات'
  const isCart = activeNav === 'سبد خرید'
  const isEmptyCart = isCart && cart.length === 0
  const isSidebarlessPage = ['رویدادها', 'درباره ما', 'تماس با ما'].includes(activeNav)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const conversationCount = demoOrders.filter((order) => role === 'operator'
    ? order.operatorId === demoOperators[0].id
    : role === 'user'
      ? order.userId === demoUserId
      : true).length
  const supportMenuItems = (
    <>
      <button type="button" role="menuitem" onClick={openSupportConversations}><Icon name="sparkle" size={17} /> دستیار هوش مصنوعی</button>
      <button type="button" role="menuitem" onClick={openSupportConversations}><Icon name="chat" size={17} /> پشتیبانی آنلاین</button>
    </>
  )

  return (
    <div className={`app-shell ${isServices ? 'service-mode' : ''} ${isCart ? 'cart-mode' : ''} ${isEmptyCart ? 'empty-cart-mode' : ''}`} data-theme={theme} data-site-style={siteStyle} dir="rtl">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setActiveNav('خانه') }} aria-label="ایکس کافه، خانه">
            <span className="brand-mark"><span /></span>
            <span className="brand-name">ایکس‌کافه<span>.</span></span>
          </a>
          <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="باز کردن منو"><Icon name="grid" /></button>
          <nav className={`main-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="ناوبری اصلی">
            {desktopNavItems.map((item) => (
              <button
                key={item.label}
                className={`nav-link ${activeNav === item.label ? 'active' : ''}`}
                onClick={() => { setActiveNav(item.label); setMobileMenuOpen(false) }}
                aria-label={item.label === 'سبد خرید' && cartCount > 0 ? `سبد خرید، ${cartCount} مورد` : item.label}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {item.label === 'سبد خرید' && cartCount > 0 && <span className="cart-count">{new Intl.NumberFormat('fa-IR').format(cartCount)}</span>}
              </button>
            ))}
          </nav>
          <div className="topbar-actions">
              <label className="search-box">
                <Icon name="search" size={18} />
                <input aria-label="جستجو" placeholder="جستجو در ایکس‌کافه..." value={search} onChange={(event) => setSearch(event.target.value)} />
                <kbd>/</kbd>
              </label>
              <div className="notification-wrap">
                <button className={`icon-button notification-button ${noticeOpen ? 'selected' : ''}`} aria-label="اعلان‌ها" onClick={() => setNoticeOpen(!noticeOpen)}>
                  <Icon name="bell" size={19} /><i />
                </button>
                {noticeOpen && <div className="notification-popover"><strong>اعلان‌ها</strong><p>سفارش طراحی شما با موفقیت تکمیل شد.</p><span>۱۲ دقیقه پیش</span></div>}
              </div>
              <button
                type="button"
                className={`icon-button desktop-cart-button ${isCart ? 'selected' : ''}`}
                aria-label={cartCount > 0 ? `سبد خرید، ${cartCount} مورد` : 'سبد خرید'}
                title="سبد خرید"
                onClick={() => setActiveNav('سبد خرید')}
              >
                <Icon name="cart" size={19} />
                {cartCount > 0 && <span className="cart-count">{new Intl.NumberFormat('fa-IR').format(cartCount)}</span>}
              </button>
              <button className="profile-chip" onClick={() => { setActiveNav('حساب کاربری'); setActivePage('داشبورد') }}>
                <span className="avatar avatar-user">ن</span>
                <span className="profile-copy"><strong>نگار محمدی</strong><small>{roleLabels[role]}</small></span>
                <span className="chevron">⌄</span>
              </button>
          </div>
        </div>
      </header>
      <header className="compact-header">
        <a className="brand compact-brand" href="#" onClick={(event) => { event.preventDefault(); setActiveNav('خانه') }} aria-label="ایکس کافه، خانه">
          <span className="brand-mark"><span /></span>
          <span className="brand-name">ایکس‌کافه<span>.</span></span>
        </a>
        <div className="compact-header-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <div className="compact-support-wrap" ref={compactSupportMenuRef}>
            <button className="compact-support-button" type="button" aria-label="پشتیبانی" aria-haspopup="menu" aria-expanded={supportMenuOpen} onClick={() => setSupportMenuOpen((current) => !current)}>
              <Icon name="support" size={18} />
            </button>
            {supportMenuOpen && <div className="compact-support-menu" role="menu">{supportMenuItems}</div>}
          </div>
        </div>
      </header>

      {isServices ? (
        <>
          <main className="service-main">
            <ServiceCatalog catalog={catalog} view={serviceView} setView={setServiceView} search={serviceSearch} setSearch={setServiceSearch} onAddToCart={addToCart} notice={cartNotice} openServiceId={requestedServiceId} onServiceRequestHandled={() => setRequestedServiceId(null)} />
          </main>
        </>
      ) : isCart ? (
        <main className="cart-main page-wrap">
          <div className="breadcrumb"><span>ایکس‌کافه</span><b>/</b><strong>سبد خرید</strong></div>
          <CartPage items={cart} onChangeQuantity={changeCartQuantity} onRemove={removeFromCart} onBrowse={() => { setCartNotice(''); setActiveNav('خدمات') }} onDemoPayment={completeDemoPayment} />
        </main>
      ) : <main className="page-wrap">
        <div className="breadcrumb"><span>ایکس‌کافه</span><b>/</b><span>{activeNav}</span><b>/</b><strong>{contentTitle}</strong></div>
        <div className={`workspace ${isSidebarlessPage ? 'workspace-no-sidebar' : ''}`}>
          {!isSidebarlessPage && <aside className="sidebar">
            <div className="account-card">
              <div className="account-avatar-wrap">
                <span className={`avatar account-avatar avatar-${role}`}>{role === 'admin' ? 'ا' : role === 'operator' ? 'س' : 'ن'}</span>
                <span className="online-dot" />
              </div>
              <div className="account-name">{role === 'admin' ? 'آرمان رضایی' : role === 'operator' ? 'سارا احمدی' : 'نگار محمدی'}</div>
              <div className="account-email">{role === 'admin' ? 'admin@xcafinet.ir' : role === 'operator' ? 'sara@xcafinet.ir' : 'negar@email.com'}</div>
              <div className="role-switcher" aria-label="انتخاب پنل">
                {(['user', 'operator', 'admin'] as Role[]).map((item) => (
                  <button key={item} className={role === item ? 'selected' : ''} onClick={() => switchRole(item)}>{roleLabels[item]}</button>
                ))}
              </div>
            </div>
            <div className="sidebar-label">منوی {roleLabels[role]}</div>
            <nav className="side-nav" aria-label={`منوی ${roleLabels[role]}`}>
              {sidebarItems[role].map((item) => (
                <button key={item.label} className={`side-link ${activePage === item.label && activeNav === 'حساب کاربری' ? 'active' : ''}`} onClick={() => { setActivePage(item.label); setActiveNav('حساب کاربری') }}>
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {item.label === 'گفتگوها' && conversationCount > 0 && <span className="side-count">{new Intl.NumberFormat('fa-IR').format(conversationCount)}</span>}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="help-card">
                <div className="help-icon"><Icon name="support" size={19} /></div>
                <strong>نیاز به راهنمایی دارید؟</strong>
                <span>ما همیشه کنار شما هستیم.</span>
                <button onClick={() => { setActiveNav('حساب کاربری'); setActivePage('گفتگوها') }}>ارتباط با پشتیبانی <Icon name="arrow" size={14} /></button>
              </div>
              <button className="logout-link"><Icon name="logout" size={18} /> خروج از حساب</button>
              <div className="sidebar-footer">ساخته‌شده با <span>♥</span> برای شما <b>نسخه ۱.۴.۰</b></div>
            </div>
          </aside>}

          <section className="dashboard">
            {activeNav !== 'خانه' && activeNav !== 'حساب کاربری' ? (
              <SectionPage section={activeNav} role={role} events={events} catalog={catalog} onOpenService={openEventService} onOpenContact={openSupportConversations} walletBalance={demoWalletBalance} />
            ) : activePage === 'داشبورد' ? (
              <Dashboard role={role} range={range} setRange={setRange} search={search} setActivePage={setActivePage} setActiveNav={setActiveNav} walletBalance={demoWalletBalance} />
            ) : (
              <PanelPage page={activePage} role={role} search={search} catalog={catalog} events={events} siteStyle={siteStyle} setSiteStyle={setSiteStyle} addCategory={addCategory} addService={addService} updateCategory={updateCategory} deleteCategory={deleteCategory} updateService={updateService} deleteService={deleteService} addEvent={addEvent} deleteEvent={deleteEvent} demoOrders={demoOrders} activeDemoOrderId={activeDemoOrderId} onOpenDemoOrder={setActiveDemoOrderId} onSendDemoMessage={sendDemoMessage} onOfferAdditionalService={offerDemoAdditionalService} onStartAdditionalServicePayment={startDemoAdditionalServicePayment} onCompleteAdditionalServicePayment={completeDemoAdditionalServicePayment} onCloseDemoConversation={closeDemoConversation} onCancelDemoOrder={cancelDemoOrder} walletBalance={demoWalletBalance} />
            )}
          </section>
        </div>
      </main>}
      <footer className={`mobile-bottom-nav ${isServices ? 'service-bottom-nav' : ''}`} aria-label="ناوبری اصلی پایین صفحه">
        <button className={`mobile-service-launch ${isServices ? 'active' : ''}`} type="button" onClick={() => setActiveNav('خدمات')} aria-label="خدمات" title="خدمات">
          <Icon name="grid" size={21} />
        </button>
        <div className="mobile-bottom-nav-links">
          {navItems.filter((item) => item.label !== 'خدمات').map((item) => <button key={item.label} className={activeNav === item.label ? 'active' : ''} onClick={() => setActiveNav(item.label)} aria-label={item.label === 'سبد خرید' && cartCount > 0 ? `سبد خرید، ${cartCount} مورد` : item.label}><span className="bottom-nav-icon"><Icon name={item.icon} size={19} />{item.label === 'سبد خرید' && cartCount > 0 && <span className="cart-count">{new Intl.NumberFormat('fa-IR').format(cartCount)}</span>}</span><span>{item.label}</span></button>)}
        </div>
      </footer>
      <div className="desktop-support-wrap" ref={desktopSupportMenuRef}>
        <button className="desktop-support-button" type="button" aria-label="پشتیبانی" aria-haspopup="menu" aria-expanded={supportMenuOpen} onClick={() => setSupportMenuOpen((current) => !current)}>
          <Icon name="support" size={19} />
        </button>
        {supportMenuOpen && <div className="desktop-support-menu" role="menu">{supportMenuItems}</div>}
      </div>
      <div className="desktop-theme-toggle">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
    </div>
  )
}

function Dashboard({
  role,
  range,
  setRange,
  search,
  setActivePage,
  setActiveNav,
  walletBalance,
}: {
  role: Role
  range: string
  setRange: (range: string) => void
  search: string
  setActivePage: (page: string) => void
  setActiveNav: (nav: string) => void
  walletBalance: number
}) {
  const isAdmin = role === 'admin'
  const isOperator = role === 'operator'
  const title = isAdmin ? 'آرمان عزیز، خوش آمدی 👋' : isOperator ? 'سلام سارا، روزت بخیر 👋' : 'صبح بخیر نگار جان 👋'
  const subtitle = isAdmin ? 'اینجا می‌تونی همه‌چیز رو زیر نظر داشته باشی.' : isOperator ? 'آماده‌ای امروز به چند نفر کمک کنی؟' : 'از اینجا همه‌چیز در دسترس توئه. امروز چطور می‌تونیم کمکت کنیم؟'
  const filteredOrders = orders.filter((order) => `${order.id} ${order.service} ${order.status}`.includes(search.trim()))

  return (
    <>
      <div className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> پنج‌شنبه، ۲۹ آبان ۱۴۰۴</div><h1>{title}</h1><p>{subtitle}</p></div>
        <button className="primary-button" onClick={() => setActiveNav('خدمات')}><Icon name="plus" size={17} /> {isOperator ? 'مشاهده گفتگوها' : isAdmin ? 'مدیریت کاربران' : 'ثبت سفارش جدید'}</button>
      </div>
      <div className="metric-grid">
        <MetricCard title={isAdmin ? 'درآمد کل' : isOperator ? 'گفتگوهای امروز' : 'موجودی کیف پول'} value={isOperator ? '۱۲' : isAdmin ? '۸۴۲,۵۰۰,۰۰۰' : new Intl.NumberFormat('fa-IR').format(walletBalance)} unit={isOperator ? 'گفتگو' : 'ریال'} change="+۱۲.۸٪" icon={isOperator ? 'chat' : 'wallet'} tone="purple" note={isOperator ? '۳ گفتگوی جدید' : 'نسبت به ماه گذشته'} />
        <MetricCard title={isAdmin ? 'کاربران فعال' : isOperator ? 'رضایت مشتریان' : 'سفارش‌های فعال'} value={isOperator ? '۹۸' : isAdmin ? '۱,۲۸۴' : '۳'} unit={isOperator ? '٪' : 'عدد'} change="+۸.۲٪" icon={isAdmin ? 'users' : isOperator ? 'sparkle' : 'receipt'} tone="mint" note={isOperator ? 'عالی پیش می‌ری!' : 'نسبت به ماه گذشته'} />
        <MetricCard title={isAdmin ? 'سفارش‌های امروز' : isOperator ? 'سفارش تکمیل‌شده' : 'سفارش‌های تکمیل‌شده'} value={isOperator ? '۲۸' : isAdmin ? '۳۶' : '۱۸'} unit="عدد" change="+۴.۵٪" icon="check" tone="orange" note="نسبت به ماه گذشته" />
        <MetricCard title={isAdmin ? 'اپراتورهای آنلاین' : isOperator ? 'میانگین پاسخ‌گویی' : 'امتیاز شما'} value={isOperator ? '۲' : isAdmin ? '۸' : '۴.۹'} unit={isOperator ? 'دقیقه' : isAdmin ? 'نفر' : 'از ۵'} change={isOperator ? '−۱.۲٪' : '+۰.۶٪'} icon={isOperator ? 'clock' : isAdmin ? 'support' : 'sparkle'} tone="blue" note={isOperator ? 'سریع‌تر از هفته قبل' : 'بر اساس بازخوردها'} />
      </div>

      <div className="main-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div><h2>{isAdmin ? 'گزارش درآمد' : isOperator ? 'عملکرد گفتگوها' : 'آمار سفارش‌ها'}</h2><p>{isAdmin ? 'روند درآمد کسب‌وکار شما' : isOperator ? 'تعداد گفتگوهای پاسخ‌داده‌شده' : 'نگاهی به فعالیت‌های اخیرت'}</p></div>
            <select className="range-select" value={range} onChange={(event) => setRange(event.target.value)} aria-label="بازه نمودار">
              <option>این هفته</option><option>این ماه</option><option>امسال</option>
            </select>
          </div>
          <div className="chart-summary"><strong>{isAdmin ? '۸۴۲,۵۰۰,۰۰۰' : isOperator ? '۱۲۸' : '۵۵,۳۰۰,۰۰۰'} <small>{isOperator ? 'گفتگو' : 'ریال'}</small></strong><span className="chart-trend"><Icon name="arrow" size={13} /> ۱۲.۸٪</span><span className="summary-caption">در مقایسه با بازهٔ قبل</span></div>
          <div className="chart-area">
            <div className="chart-y-labels"><span>۱۰۰ م</span><span>۷۵ م</span><span>۵۰ م</span><span>۲۵ م</span><span>۰</span></div>
            <svg className="chart-svg" viewBox="0 0 650 180" preserveAspectRatio="none" role="img" aria-label="نمودار روند فعالیت در طول هفته">
              <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7058f4" stopOpacity=".19" /><stop offset="100%" stopColor="#7058f4" stopOpacity="0" /></linearGradient></defs>
              <path className="grid-line" d="M0 10H650M0 50H650M0 90H650M0 130H650M0 170H650" />
              <path d="M0 132 C35 128 50 112 82 117 S134 136 166 104 S214 92 248 100 S294 115 330 75 S375 62 412 80 S463 95 493 51 S542 70 575 42 S620 47 650 17 L650 170 L0 170Z" fill="url(#chartFill)" />
              <path className="chart-line" d="M0 132 C35 128 50 112 82 117 S134 136 166 104 S214 92 248 100 S294 115 330 75 S375 62 412 80 S463 95 493 51 S542 70 575 42 S620 47 650 17" />
              <circle cx="493" cy="51" r="5" className="chart-point-halo" /><circle cx="493" cy="51" r="3" className="chart-point" />
            </svg>
          </div>
          <div className="chart-x-labels"><span>شنبه</span><span>یکشنبه</span><span>دوشنبه</span><span>سه‌شنبه</span><span>چهارشنبه</span><span>پنج‌شنبه</span><span>جمعه</span></div>
        </section>

        <section className="panel balance-panel">
          <div className="panel-heading"><div><h2>{isAdmin ? 'خلاصه کیف پول' : isOperator ? 'وضعیت امروز' : 'کیف پول من'}</h2><p>{isAdmin ? 'موجودی حساب پلتفرم' : isOperator ? 'گزارش فعالیت روزانه' : 'موجودی قابل استفاده'}</p></div><button className="more-button" aria-label="گزینه‌های بیشتر"><Icon name="more" /></button></div>
          <div className="balance-card">
            <div className="balance-top"><span>{isOperator ? 'گفتگوهای پاسخ‌داده‌شده' : 'موجودی فعلی'}</span><span className="balance-card-icon"><Icon name={isOperator ? 'chat' : 'wallet'} size={18} /></span></div>
            <div className="balance-amount">{isOperator ? '۲۸' : isAdmin ? '۱۲۸,۴۰۰,۰۰۰' : new Intl.NumberFormat('fa-IR').format(walletBalance)} <small>{isOperator ? 'گفتگو' : 'ریال'}</small></div>
            <div className="balance-footer"><span><i /> {isOperator ? '۴ گفتگوی تازه' : 'به‌روز در همین لحظه'}</span><Icon name="arrow" size={15} /></div>
          </div>
          <div className="balance-actions">
            <button onClick={() => setActiveNav('کیف پول')}><span><Icon name="plus" size={17} /></span>{isOperator ? 'مشاهده گفتگوها' : 'افزایش موجودی'}</button>
            <button onClick={() => setActiveNav('کیف پول')}><span className="outline-icon"><Icon name="receipt" size={17} /></span>تاریخچه تراکنش‌ها</button>
          </div>
          <div className="balance-note"><span className="note-icon"><Icon name="sparkle" size={16} /></span><span>{isOperator ? 'تا اینجا فوق‌العاده بودی؛ ادامه بده!' : 'با هر سفارش، تجربه‌ای تازه بساز.'}</span></div>
        </section>
      </div>

      <section className="panel orders-panel">
        <div className="panel-heading orders-heading">
          <div><h2>{isAdmin ? 'آخرین سفارش‌ها' : isOperator ? 'گفتگوهای اخیر' : 'آخرین سفارش‌ها'}</h2><p>{isOperator ? 'گفتگوهایی که اخیراً پیگیری کردی' : 'آخرین فعالیت‌های ثبت‌شده در حساب تو'}</p></div>
          <button className="text-button" onClick={() => { setActivePage(isOperator ? 'گفتگوها' : 'سفارشات'); setActiveNav('حساب کاربری') }}>مشاهده همه <Icon name="arrow" size={15} /></button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>{isOperator ? 'مشتری' : 'عنوان سفارش'}</th><th>کد سفارش</th><th>تاریخ ثبت</th><th>مبلغ</th><th>وضعیت</th><th /></tr></thead>
            <tbody>{filteredOrders.length ? filteredOrders.map((order) => (
              <tr key={order.id}>
                <td><div className="service-cell"><span className={`service-icon ${order.tone}`}>{isOperator ? order.initials : <Icon name="grid" size={17} />}</span><strong>{isOperator ? 'مریم کریمی' : order.service}<small>{isOperator ? order.service : 'خدمات ایکس‌کافه'}</small></strong></div></td>
                <td className="order-id">{order.id}</td><td>{order.date}</td><td className="amount-cell">{order.amount} <small>ریال</small></td>
                <td><span className={`status-pill ${order.tone === 'purple' ? 'in-progress' : 'complete'}`}><i />{isOperator && order.tone === 'purple' ? 'پاسخ جدید' : order.status}</span></td>
                <td><button className="row-more" aria-label={`گزینه‌های ${order.id}`}><Icon name="more" size={18} /></button></td>
              </tr>
            )) : <tr><td className="empty-row" colSpan={6}>سفارشی با این عبارت پیدا نشد.</td></tr>}</tbody>
          </table>
        </div>
      </section>
      <div className="dashboard-bottom-note"><Icon name="sparkle" size={15} /> به جمع <strong>۱۲,۰۰۰+</strong> کاربر خوش‌سلیقهٔ ایکس‌کافه خوش اومدی!</div>
    </>
  )
}

function MetricCard({ title, value, unit, change, icon, tone, note }: { title: string; value: string; unit: string; change: string; icon: IconName; tone: string; note: string }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span className={`metric-icon ${tone}`}><Icon name={icon} size={19} /></span><span className="metric-change"><Icon name="arrow" size={12} />{change}</span></div>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <div className="metric-note">{note}</div>
    </article>
  )
}

function ServiceCatalog({
  catalog,
  view,
  setView,
  search,
  setSearch,
  onAddToCart,
  notice,
  openServiceId,
  onServiceRequestHandled,
}: {
  catalog: ServiceCatalogData
  view: ServiceView
  setView: (view: ServiceView) => void
  search: string
  setSearch: (search: string) => void
  onAddToCart: (service: CatalogService, categoryName: string) => void
  notice: string
  openServiceId: string | null
  onServiceRequestHandled: () => void
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [localSelectedServiceId, setLocalSelectedServiceId] = useState<string | null>(null)
  const selectedServiceId = openServiceId ?? localSelectedServiceId
  const query = search.trim().toLocaleLowerCase('fa-IR')
  const visibleServices = catalog.services.filter((service) => {
    const category = catalog.categories.find((item) => item.id === service.categoryId)
    const matchesSearch = `${service.name} ${service.description} ${category?.name ?? ''}`
      .toLocaleLowerCase('fa-IR')
      .includes(query)

    return matchesSearch
  })
  const selectedCategory = catalog.categories.find((category) => category.id === selectedCategoryId)
  const selectedService = catalog.services.find((service) => service.id === selectedServiceId)
  const selectedServiceCategory = selectedService
    ? catalog.categories.find((category) => category.id === selectedService.categoryId)
    : undefined
  const categoryServices = selectedCategory
    ? catalog.services.filter((service) => service.categoryId === selectedCategory.id)
    : []

  const closeSelectedService = () => {
    if (openServiceId) onServiceRequestHandled()
    else setLocalSelectedServiceId(null)
  }

  useEffect(() => {
    if (!selectedCategoryId && !selectedServiceId) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (selectedServiceId) {
        if (openServiceId) onServiceRequestHandled()
        else setLocalSelectedServiceId(null)
      }
      else setSelectedCategoryId(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onServiceRequestHandled, openServiceId, selectedCategoryId, selectedServiceId])

  return (
    <>
      <div className="service-tabs" role="tablist" aria-label="نمایش خدمات">
        <button role="tab" aria-selected={view === 'categories'} className={view === 'categories' ? 'active' : ''} onClick={() => { setView('categories'); setSelectedCategoryId(null) }}>دسته‌بندی</button>
        <button role="tab" aria-selected={view === 'all'} className={view === 'all' ? 'active' : ''} onClick={() => { setView('all'); setSelectedCategoryId(null) }}>همه خدمات</button>
      </div>
      {view === 'all' && <label className="service-search">
          <Icon name="search" size={18} />
          <input aria-label="جست‌وجو در خدمات" placeholder="جست‌وجو در خدمات و دسته‌بندی‌ها..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>}
      {notice && <p className="cart-notice" role="status" aria-live="polite">{notice}</p>}
      {view === 'categories' ? (
        <div className="service-grid category-grid">
          {catalog.categories.map((category, index) => {
            const count = catalog.services.filter((service) => service.categoryId === category.id).length
            const tone = ['violet', 'blue', 'mint'][index % 3]

            return <article className="service-card category-service-card" key={category.id}>
              <div className="service-card-title-row">
                <span className={`feature-icon ${tone}`}>{category.icon ? <img className="catalog-icon-image" src={category.icon} alt="" /> : <Icon name="grid" size={22} />}</span>
                <h2>{category.name}</h2>
              </div>
              <div className="category-card-footer">
                <span>{new Intl.NumberFormat('fa-IR').format(count)} خدمت</span>
                <button type="button" aria-haspopup="dialog" onClick={() => setSelectedCategoryId(category.id)}>دیدن خدمات <Icon name="arrow" size={15} /></button>
              </div>
            </article>
          })}
        </div>
      ) : (
        <div className="service-grid">
          {visibleServices.map((service, index) => {
            const category = catalog.categories.find((item) => item.id === service.categoryId)
            const tone = ['violet', 'blue', 'mint'][index % 3]

            return <PublicServiceCard
              key={service.id}
              service={service}
              categoryName={category?.name ?? 'خدمات'}
              tone={tone}
              onSelect={() => setLocalSelectedServiceId(service.id)}
            />
          })}
          {visibleServices.length === 0 && <p className="catalog-empty">خدمتی با این عبارت پیدا نشد.</p>}
        </div>
      )}
      {selectedCategory && <div className="public-service-dialog-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setSelectedCategoryId(null) }}>
        <section className="public-service-dialog" role="dialog" aria-modal="true" aria-labelledby="public-category-services-title">
          <div className="public-service-dialog-heading">
            <div className="public-category-heading">
              <span className="feature-icon violet">{selectedCategory.icon ? <img className="catalog-icon-image" src={selectedCategory.icon} alt="" /> : <Icon name="grid" size={20} />}</span>
              <h2 id="public-category-services-title">{selectedCategory.name}</h2>
            </div>
            <button type="button" className="close-category-dialog" aria-label="بستن خدمات" onClick={() => setSelectedCategoryId(null)}>×</button>
          </div>
          {notice && <p className="cart-notice" role="status" aria-live="polite">{notice}</p>}
          <div className="public-service-dialog-grid">
            {categoryServices.map((service, index) => {
              const tone = ['violet', 'blue', 'mint'][index % 3]

              return <PublicServiceCard
                key={service.id}
                service={service}
                categoryName={selectedCategory.name}
                tone={tone}
                onSelect={() => setLocalSelectedServiceId(service.id)}
              />
            })}
          </div>
          {categoryServices.length === 0 && <p className="catalog-empty">هنوز خدمتی در این دسته ثبت نشده است.</p>}
        </section>
      </div>}
      {selectedService && <div className="public-service-details-backdrop" onClick={(event) => { if (event.target === event.currentTarget) closeSelectedService() }}>
        <section className="public-service-details-dialog" role="dialog" aria-modal="true" aria-labelledby="public-service-details-title">
          <div className="public-service-details-heading">
            <div className="public-service-details-title-row">
              <span className="feature-icon violet">{selectedService.icon ? <img className="catalog-icon-image" src={selectedService.icon} alt="" /> : <Icon name="sparkle" size={22} />}</span>
              <div>
                <span className="service-category-label">{selectedServiceCategory?.name ?? 'خدمات'}</span>
                <h2 id="public-service-details-title">{selectedService.name}</h2>
              </div>
            </div>
            <button type="button" className="close-category-dialog" aria-label="بستن جزئیات خدمت" onClick={closeSelectedService}>×</button>
          </div>
          <p className="public-service-details-description">{selectedService.description || 'توضیحی برای این خدمت ثبت نشده است.'}</p>
          <div className="public-service-details-footer">
            <strong>{new Intl.NumberFormat('fa-IR').format(selectedService.price)} <small>ریال</small></strong>
            <button type="button" className="primary-button add-to-cart-button" onClick={() => {
              onAddToCart(selectedService, selectedServiceCategory?.name ?? 'خدمات')
              closeSelectedService()
            }}><Icon name="cart" size={16} /> افزودن به سبد خرید</button>
          </div>
        </section>
      </div>}
    </>
  )
}

function PublicServiceCard({ service, categoryName, tone, onSelect }: {
  service: CatalogService
  categoryName: string
  tone: string
  onSelect: () => void
}) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect()
  }

  return (
    <article className="service-card service-card-selectable" role="button" tabIndex={0} aria-label={`مشاهده جزئیات ${service.name}`} onClick={onSelect} onKeyDown={handleKeyDown}>
      <span className="service-category-label">{categoryName}</span>
      <div className="service-card-title-row">
        <span className={`feature-icon ${tone}`}>{service.icon ? <img className="catalog-icon-image" src={service.icon} alt="" /> : <Icon name="sparkle" size={22} />}</span>
        <h2>{service.name}</h2>
      </div>
      <div className="service-card-footer">
        <strong>{new Intl.NumberFormat('fa-IR').format(service.price)} <small>ریال</small></strong>
        <span className="service-card-details-link">جزئیات <Icon name="arrow" size={14} /></span>
      </div>
    </article>
  )
}

function CartPage({
  items,
  onChangeQuantity,
  onRemove,
  onBrowse,
  onDemoPayment,
}: {
  items: CartItem[]
  onChangeQuantity: (serviceId: string, change: number) => void
  onRemove: (serviceId: string) => void
  onBrowse: () => void
  onDemoPayment: () => boolean
}) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price)

  return (
    <section className="cart-page">
      <div className="cart-page-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-dot" /> خرید شما</span>
          <h1>سبد خرید</h1>
          <p>{new Intl.NumberFormat('fa-IR').format(totalQuantity)} خدمت در سبد خرید شما</p>
        </div>
        {items.length > 0 && <button className="text-button" onClick={onBrowse}><Icon name="plus" size={16} /> افزودن خدمات بیشتر</button>}
      </div>

      {items.length === 0 ? (
        <div className="cart-empty panel">
          <span className="cart-empty-icon"><Icon name="cart" size={29} /></span>
          <h2>سبد خریدت هنوز خالیه</h2>
          <p>خدمات موردنظرت رو انتخاب کن تا اینجا ببینیشون.</p>
          <button className="primary-button" onClick={onBrowse}><Icon name="grid" size={16} /> دیدن خدمات</button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items panel">
            {items.map((item, index) => (
              <article className="cart-item" key={item.serviceId}>
                <span className={`cart-item-icon tone-${index % 3}`}><Icon name="sparkle" size={20} /></span>
                <div className="cart-item-info">
                  <span>{item.categoryName}</span>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <strong className="cart-mobile-price">{formatPrice(item.price)} <small>ریال</small></strong>
                </div>
                <strong className="cart-unit-price">{formatPrice(item.price)} <small>ریال</small></strong>
                <div className="quantity-control" aria-label={`تعداد ${item.name}`}>
                  <button aria-label={`افزایش تعداد ${item.name}`} onClick={() => onChangeQuantity(item.serviceId, 1)}><Icon name="plus" size={14} /></button>
                  <span>{new Intl.NumberFormat('fa-IR').format(item.quantity)}</span>
                  <button aria-label={`کاهش تعداد ${item.name}`} onClick={() => onChangeQuantity(item.serviceId, -1)}><Icon name="minus" size={14} /></button>
                </div>
                <strong className="cart-line-price">{formatPrice(item.price * item.quantity)} <small>ریال</small></strong>
                <button className="cart-remove-button" aria-label={`حذف ${item.name} از سبد`} onClick={() => onRemove(item.serviceId)}><Icon name="trash" size={17} /></button>
              </article>
            ))}
          </div>
          <aside className="cart-summary panel">
            <h2>خلاصه سفارش</h2>
            <div><span>تعداد خدمات</span><strong>{new Intl.NumberFormat('fa-IR').format(totalQuantity)}</strong></div>
            <div className="cart-total"><span>مبلغ کل</span><strong>{formatPrice(totalPrice)} <small>ریال</small></strong></div>
            <p>این پرداخت فقط برای آزمایش مسیر سفارش است و هیچ پولی جابه‌جا نمی‌شود.</p>
            <button className="primary-button cart-pay-button" type="button" onClick={() => setPaymentDialogOpen(true)}><Icon name="wallet" size={16} /> پرداخت</button>
          </aside>
        </div>
      )}
      {paymentDialogOpen && (
        <div className="category-dialog-backdrop user-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPaymentDialogOpen(false)
        }}>
          <section className="category-delete-dialog payment-unavailable-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-unavailable-title">
            <span className="feature-icon violet payment-unavailable-icon"><Icon name="wallet" size={21} /></span>
            <h3 id="payment-unavailable-title">پرداخت آزمایشی</h3>
            <p>با تأیید این مرحله، سفارش به‌صورت آزمایشی ثبت می‌شود و یک گفت‌وگوی اختصاصی با اپراتور برای کل سبد باز می‌شود. هیچ پرداخت واقعی انجام نمی‌شود.</p>
            {paymentError && <p className="user-form-error" role="alert">{paymentError}</p>}
            <div className="category-dialog-actions">
              <button type="button" className="cancel-delete-button" onClick={() => { setPaymentError(''); setPaymentDialogOpen(false) }}>انصراف</button>
              <button type="button" className="confirm-delete-button demo-payment-confirm" onClick={() => {
                setPaymentError('')
                if (!onDemoPayment()) setPaymentError('ثبت سفارش آزمایشی انجام نشد. دوباره تلاش کنید.')
              }}>شبیه‌سازی پرداخت موفق</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function IconUploadField({ label, value, onUpload, onRemove }: {
  label: string
  value: string
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  return (
    <div className="settings-field icon-upload-field">
      <span>{label}</span>
      <div className="icon-upload-row">
        <label className="icon-upload-button">
          <input type="file" accept="image/*" aria-label={label} onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) onUpload(file)
            event.currentTarget.value = ''
          }} />
          {value ? <img src={value} alt="" /> : <Icon name="plus" size={17} />}
          <span>{value ? 'تغییر آیکن' : 'افزودن آیکن'}</span>
        </label>
        {value && <button type="button" className="icon-upload-remove" onClick={onRemove}>حذف آیکن</button>}
      </div>
      <small className="icon-upload-hint">تصویر تا ۵ مگابایت؛ برای ذخیره سبک‌سازی می‌شود.</small>
    </div>
  )
}

function CatalogManager({
  catalog,
  addCategory,
  addService,
  updateCategory,
  deleteCategory,
  updateService,
  deleteService,
}: {
  catalog: ServiceCatalogData
  addCategory: (category: CatalogCategory) => void
  addService: (service: CatalogService) => void
  updateCategory: (category: CatalogCategory) => void
  deleteCategory: (categoryId: string) => void
  updateService: (service: CatalogService) => void
  deleteService: (serviceId: string) => void
}) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryIcon, setCategoryIcon] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState<string | null>(null)
  const [openServiceMenuId, setOpenServiceMenuId] = useState<string | null>(null)
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<CatalogCategory | null>(null)
  const [pendingDeleteService, setPendingDeleteService] = useState<CatalogService | null>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceIcon, setServiceIcon] = useState('')
  const [serviceCategoryId, setServiceCategoryId] = useState(catalog.categories[0]?.id ?? '')
  const [editServiceName, setEditServiceName] = useState('')
  const [editServiceDescription, setEditServiceDescription] = useState('')
  const [editServicePrice, setEditServicePrice] = useState('')
  const [editServiceCategoryId, setEditServiceCategoryId] = useState('')
  const [editServiceIcon, setEditServiceIcon] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const longPressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)

  const uploadIcon = (file: File, setIcon: (icon: string) => void) => {
    void createCatalogIcon(file).then(setIcon).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'آیکن بارگذاری نشد.')
      setSuccess('')
    })
  }

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const startLongPress = (onLongPress: () => void) => (event: ReactPointerEvent<HTMLElement>) => {
    longPressTriggered.current = false
    clearLongPress()
    if (event.pointerType === 'mouse') return

    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true
      onLongPress()
    }, 500)
  }

  const openMenuFromContext = (event: ReactMouseEvent<HTMLElement>, onLongPress: () => void) => {
    event.preventDefault()
    clearLongPress()
    longPressTriggered.current = true
    onLongPress()
  }

  useEffect(() => () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current)
  }, [])

  useEffect(() => {
    if (!openCategoryMenuId && !openServiceMenuId) return

    const closeMenusOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (!event.target.closest('.category-menu-wrap')) setOpenCategoryMenuId(null)
      if (!event.target.closest('.service-menu-wrap')) setOpenServiceMenuId(null)
    }

    document.addEventListener('pointerdown', closeMenusOutside)
    return () => document.removeEventListener('pointerdown', closeMenusOutside)
  }, [openCategoryMenuId, openServiceMenuId])

  const handleAddCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) {
      setError('نام دسته‌بندی را وارد کنید.')
      setSuccess('')
      return
    }
    if (catalog.categories.some((category) => category.id !== editingCategoryId && category.name.toLocaleLowerCase('fa-IR') === name.toLocaleLowerCase('fa-IR'))) {
      setError('این دسته‌بندی قبلاً ساخته شده است.')
      setSuccess('')
      return
    }

    if (editingCategoryId) {
      updateCategory({ id: editingCategoryId, name, description: categoryDescription.trim(), icon: categoryIcon || undefined })
      setSuccess(`دسته‌بندی «${name}» ویرایش شد.`)
    } else {
      const category = { id: createCatalogId('category'), name, description: '', icon: categoryIcon || undefined }
      addCategory(category)
      setServiceCategoryId(category.id)
      setSuccess(`دسته‌بندی «${name}» ساخته شد.`)
    }

    setCategoryName('')
    setCategoryDescription('')
    setCategoryIcon('')
    setEditingCategoryId(null)
    setError('')
  }

  const beginCategoryEdit = (category: CatalogCategory) => {
    setCategoryName(category.name)
    setCategoryDescription(category.description)
    setCategoryIcon(category.icon ?? '')
    setEditingCategoryId(category.id)
    setOpenCategoryMenuId(null)
    setError('')
    setSuccess('')
  }

  const cancelCategoryEdit = () => {
    setCategoryName('')
    setCategoryDescription('')
    setCategoryIcon('')
    setEditingCategoryId(null)
    setError('')
  }

  useEffect(() => {
    if (!selectedCategoryId && !pendingDeleteCategory && !pendingDeleteService && !openCategoryMenuId && !openServiceMenuId) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (pendingDeleteCategory) setPendingDeleteCategory(null)
      else if (pendingDeleteService) setPendingDeleteService(null)
      else if (openServiceMenuId) setOpenServiceMenuId(null)
      else if (openCategoryMenuId) setOpenCategoryMenuId(null)
      else setSelectedCategoryId(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCategoryId, pendingDeleteCategory, pendingDeleteService, openCategoryMenuId, openServiceMenuId])

  const confirmCategoryDelete = () => {
    if (!pendingDeleteCategory) return

    deleteCategory(pendingDeleteCategory.id)
    setSelectedCategoryId((current) => current === pendingDeleteCategory.id ? null : current)
    setOpenCategoryMenuId(null)
    setServiceCategoryId((current) => current === pendingDeleteCategory.id
      ? catalog.categories.find((category) => category.id !== pendingDeleteCategory.id)?.id ?? ''
      : current)
    if (editingCategoryId === pendingDeleteCategory.id) cancelCategoryEdit()
    setSuccess(`دسته‌بندی «${pendingDeleteCategory.name}» و خدماتش حذف شد.`)
    setError('')
    setPendingDeleteCategory(null)
  }

  const handleAddService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = serviceName.trim()
    const price = Number(servicePrice)
    const category = catalog.categories.find((item) => item.id === serviceCategoryId)

    if (!category) {
      setError('ابتدا یک دسته‌بندی بسازید یا انتخاب کنید.')
      setSuccess('')
      return
    }
    if (!name) {
      setError('نام خدمت را وارد کنید.')
      setSuccess('')
      return
    }
    if (!Number.isSafeInteger(price) || price <= 0) {
      setError('قیمت باید یک عدد صحیح بزرگ‌تر از صفر باشد.')
      setSuccess('')
      return
    }
    if (catalog.services.some((service) => service.categoryId === category.id && service.name.toLocaleLowerCase('fa-IR') === name.toLocaleLowerCase('fa-IR'))) {
      setError('این خدمت در دسته‌بندی انتخاب‌شده وجود دارد.')
      setSuccess('')
      return
    }

    addService({
      id: createCatalogId('service'),
      categoryId: category.id,
      name,
      description: serviceDescription.trim(),
      price,
      icon: serviceIcon || undefined,
    })
    setServiceName('')
    setServiceDescription('')
    setServicePrice('')
    setServiceIcon('')
    setError('')
    setSuccess(`خدمت «${name}» به «${category.name}» اضافه شد.`)
  }

  const beginServiceEdit = (service: CatalogService) => {
    setEditingServiceId(service.id)
    setEditServiceName(service.name)
    setEditServiceDescription(service.description)
    setEditServicePrice(String(service.price))
    setEditServiceCategoryId(service.categoryId)
    setEditServiceIcon(service.icon ?? '')
    setOpenServiceMenuId(null)
  }

  const cancelServiceEdit = () => {
    setEditingServiceId(null)
    setEditServiceName('')
    setEditServiceDescription('')
    setEditServicePrice('')
    setEditServiceCategoryId('')
    setEditServiceIcon('')
    setError('')
  }

  const handleUpdateService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingServiceId) return

    const name = editServiceName.trim()
    const price = Number(editServicePrice)
    const category = catalog.categories.find((item) => item.id === editServiceCategoryId)
    if (!category) {
      setError('یک دسته‌بندی برای خدمت انتخاب کنید.')
      return
    }
    if (!name) {
      setError('نام خدمت را وارد کنید.')
      return
    }
    if (!Number.isSafeInteger(price) || price <= 0) {
      setError('قیمت باید یک عدد صحیح بزرگ‌تر از صفر باشد.')
      return
    }
    if (catalog.services.some((service) => service.id !== editingServiceId
      && service.categoryId === category.id
      && service.name.toLocaleLowerCase('fa-IR') === name.toLocaleLowerCase('fa-IR'))) {
      setError('این خدمت در دسته‌بندی انتخاب‌شده وجود دارد.')
      return
    }

    updateService({
      id: editingServiceId,
      categoryId: category.id,
      name,
      description: editServiceDescription.trim(),
      price,
      icon: editServiceIcon || undefined,
    })
    cancelServiceEdit()
    setError('')
    setSuccess(`خدمت «${name}» ویرایش شد.`)
  }

  const confirmServiceDelete = () => {
    if (!pendingDeleteService) return

    deleteService(pendingDeleteService.id)
    if (editingServiceId === pendingDeleteService.id) cancelServiceEdit()
    setOpenServiceMenuId(null)
    setSuccess(`خدمت «${pendingDeleteService.name}» حذف شد.`)
    setError('')
    setPendingDeleteService(null)
  }

  const selectedCategory = catalog.categories.find((category) => category.id === selectedCategoryId)
  const selectedCategoryServices = selectedCategory
    ? catalog.services.filter((service) => service.categoryId === selectedCategory.id)
    : []

  return (
    <section className="catalog-manager">
      <div className="catalog-manager-heading">
        <span className="metric-icon purple"><Icon name="grid" size={19} /></span>
        <div><h2>مدیریت دسته‌بندی و خدمات</h2><p>دسته‌بندی بسازید، خدمت و قیمت آن را ثبت کنید.</p></div>
      </div>
      <div className="catalog-manager-forms">
        <form className="catalog-form" onSubmit={handleAddCategory}>
          <h3>{editingCategoryId ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h3>
          <label className="settings-field"><span>نام دسته‌بندی</span><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="مثلاً طراحی و برندینگ" required /></label>
          <IconUploadField label="آیکن دسته‌بندی" value={categoryIcon} onUpload={(file) => uploadIcon(file, setCategoryIcon)} onRemove={() => setCategoryIcon('')} />
          <div className="catalog-form-actions">
            <button className="primary-button catalog-submit" type="submit"><Icon name={editingCategoryId ? 'check' : 'plus'} size={16} /> {editingCategoryId ? 'ذخیره ویرایش' : 'ساخت دسته‌بندی'}</button>
            {editingCategoryId && <button className="catalog-cancel-edit" type="button" onClick={cancelCategoryEdit}>انصراف</button>}
          </div>
        </form>

        <form className="catalog-form" onSubmit={handleAddService}>
          <h3>خدمت جدید</h3>
          <label className="settings-field"><span>دسته‌بندی</span><select value={serviceCategoryId} onChange={(event) => setServiceCategoryId(event.target.value)} required disabled={catalog.categories.length === 0}><option value="" disabled>انتخاب دسته‌بندی</option>{catalog.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          <label className="settings-field"><span>نام خدمت</span><input value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="مثلاً طراحی لوگو" required /></label>
          <label className="settings-field"><span>توضیحات خدمت (اختیاری)</span><input value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value)} placeholder="شرح کوتاه خدمت" /></label>
          <label className="settings-field"><span>قیمت (ریال)</span><input type="number" min="1" step="1" inputMode="numeric" value={servicePrice} onChange={(event) => setServicePrice(event.target.value)} placeholder="مثلاً ۵۰۰۰۰۰۰" required /></label>
          <IconUploadField label="آیکن خدمت" value={serviceIcon} onUpload={(file) => uploadIcon(file, setServiceIcon)} onRemove={() => setServiceIcon('')} />
          <button className="primary-button catalog-submit" type="submit" disabled={catalog.categories.length === 0}><Icon name="plus" size={16} /> ثبت خدمت</button>
        </form>
      </div>
      {error && <p className="catalog-feedback error" role="alert">{error}</p>}
      {success && <p className="catalog-feedback success" role="status">{success}</p>}
      <div className="managed-categories">
        <h3>دسته‌بندی‌های ثبت‌شده <span>{new Intl.NumberFormat('fa-IR').format(catalog.categories.length)}</span></h3>
        <div className="managed-category-grid">
          {catalog.categories.map((category) => {
            const categoryServices = catalog.services.filter((service) => service.categoryId === category.id)
            const menuOpen = openCategoryMenuId === category.id
            const openCategoryMenu = () => setOpenCategoryMenuId(category.id)

            return <article className="managed-category" key={category.id}>
              <button
                className="managed-category-toggle"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={selectedCategoryId === category.id}
                onPointerDown={startLongPress(openCategoryMenu)}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onContextMenu={(event) => openMenuFromContext(event, openCategoryMenu)}
                onKeyDown={(event) => {
                  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                    event.preventDefault()
                    openCategoryMenu()
                  }
                }}
                onClick={() => {
                  if (longPressTriggered.current) {
                    longPressTriggered.current = false
                    return
                  }
                  setOpenCategoryMenuId(null)
                  setOpenServiceMenuId(null)
                  setSelectedCategoryId(category.id)
                }}
              >
                <span className="feature-icon violet">{category.icon ? <img className="catalog-icon-image" src={category.icon} alt="" /> : <Icon name="grid" size={18} />}</span>
                <span className="managed-category-copy"><strong>{category.name}</strong><small>{category.description || 'بدون توضیحات'}</small></span>
                <span className="category-service-count">{new Intl.NumberFormat('fa-IR').format(categoryServices.length)} خدمت</span>
                <Icon className="category-expander" name="arrow" size={15} />
              </button>
              <div className="category-menu-wrap">
                <button className="category-menu-trigger" type="button" aria-label={`عملیات ${category.name}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setOpenCategoryMenuId((current) => current === category.id ? null : category.id)}>
                  <Icon className="vertical-more-icon" name="more" size={19} />
                </button>
                {menuOpen && <div className="category-actions-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => beginCategoryEdit(category)}><Icon name="settings" size={15} /> ویرایش</button>
                  <button type="button" role="menuitem" className="delete-category-action" onClick={() => { setOpenCategoryMenuId(null); setPendingDeleteCategory(category) }}><Icon name="trash" size={15} /> حذف دسته‌بندی</button>
                </div>}
              </div>
            </article>
          })}
        </div>
        {catalog.categories.length === 0 && <p className="managed-empty">هنوز دسته‌بندی‌ای نساخته‌اید.</p>}
      </div>
      {selectedCategory && <div className="category-dialog-backdrop service-dialog-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setSelectedCategoryId(null) }}>
        <section className="category-services-dialog" role="dialog" aria-modal="true" aria-labelledby="category-services-title">
          <div className="category-services-heading">
            <div className="category-services-heading-title">
              <span className="feature-icon violet">{selectedCategory.icon ? <img className="catalog-icon-image" src={selectedCategory.icon} alt="" /> : <Icon name="grid" size={20} />}</span>
              <h3 id="category-services-title">{selectedCategory.name}</h3>
            </div>
            <button type="button" className="close-category-dialog" aria-label="بستن خدمات" onClick={() => setSelectedCategoryId(null)}>×</button>
          </div>
          {error && <p className="catalog-feedback error" role="alert">{error}</p>}
          <div className="managed-service-grid">
            {selectedCategoryServices.map((service) => {
              const serviceMenuOpen = openServiceMenuId === service.id
              const serviceLongPress = () => setOpenServiceMenuId(service.id)

              return <article
                className={`managed-service-card ${editingServiceId === service.id ? 'editing' : ''}`}
                key={service.id}
                tabIndex={editingServiceId === service.id ? undefined : 0}
                aria-label={editingServiceId === service.id ? undefined : `عملیات خدمت ${service.name}`}
                aria-haspopup={editingServiceId === service.id ? undefined : 'menu'}
                aria-expanded={editingServiceId === service.id ? undefined : serviceMenuOpen}
                onPointerDown={editingServiceId === service.id ? undefined : startLongPress(serviceLongPress)}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
                onContextMenu={editingServiceId === service.id ? undefined : (event) => openMenuFromContext(event, serviceLongPress)}
                onKeyDown={(event) => {
                  if (editingServiceId !== service.id && (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) {
                    event.preventDefault()
                    serviceLongPress()
                  }
                }}
              >
                {editingServiceId === service.id ? (
                  <form className="managed-service-edit-form" onSubmit={handleUpdateService}>
                    <label className="settings-field"><span>دسته‌بندی</span><select value={editServiceCategoryId} onChange={(event) => setEditServiceCategoryId(event.target.value)} required>{catalog.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
                    <label className="settings-field"><span>نام خدمت</span><input value={editServiceName} onChange={(event) => setEditServiceName(event.target.value)} required /></label>
                    <label className="settings-field"><span>توضیحات</span><input value={editServiceDescription} onChange={(event) => setEditServiceDescription(event.target.value)} /></label>
                    <label className="settings-field"><span>قیمت (ریال)</span><input type="number" min="1" step="1" value={editServicePrice} onChange={(event) => setEditServicePrice(event.target.value)} required /></label>
                    <IconUploadField label="آیکن خدمت" value={editServiceIcon} onUpload={(file) => uploadIcon(file, setEditServiceIcon)} onRemove={() => setEditServiceIcon('')} />
                    <div className="managed-service-edit-actions">
                      <button className="primary-button" type="submit">ذخیره</button>
                      <button className="catalog-cancel-edit" type="button" onClick={cancelServiceEdit}>انصراف</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="managed-service-info">
                      <span className="managed-service-icon">{service.icon ? <img className="catalog-icon-image" src={service.icon} alt="" /> : <Icon name="sparkle" size={17} />}</span>
                      <div className="managed-service-copy"><strong>{service.name}</strong><small>{service.description || 'بدون توضیحات'}</small></div>
                    </div>
                    <strong className="managed-service-price">{new Intl.NumberFormat('fa-IR').format(service.price)} <small>ریال</small></strong>
                    <div className="service-menu-wrap">
                      <button className="service-menu-trigger" type="button" aria-label={`عملیات خدمت ${service.name}`} aria-haspopup="menu" aria-expanded={serviceMenuOpen} onClick={() => setOpenServiceMenuId((current) => current === service.id ? null : service.id)}>
                        <Icon className="vertical-more-icon" name="more" size={18} />
                      </button>
                      {serviceMenuOpen && <div className="category-actions-menu service-actions-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => beginServiceEdit(service)}><Icon name="settings" size={15} /> ویرایش</button>
                        <button type="button" role="menuitem" className="delete-category-action" onClick={() => { setOpenServiceMenuId(null); setPendingDeleteService(service) }}><Icon name="trash" size={15} /> حذف خدمت</button>
                      </div>}
                    </div>
                  </>
                )}
              </article>
            })}
          </div>
          {selectedCategoryServices.length === 0 && <p className="managed-empty">هنوز خدمتی در این دسته ثبت نشده است.</p>}
        </section>
      </div>}
      {pendingDeleteCategory && <div className="category-dialog-backdrop">
        <section className="category-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-category-title" aria-describedby="delete-category-description">
          <span className="delete-warning-icon"><Icon name="trash" size={21} /></span>
          <h3 id="delete-category-title">حذف دسته‌بندی؟</h3>
          <p id="delete-category-description">دستهٔ «{pendingDeleteCategory.name}» و همهٔ {new Intl.NumberFormat('fa-IR').format(catalog.services.filter((service) => service.categoryId === pendingDeleteCategory.id).length)} خدمت آن حذف می‌شوند. این کار قابل بازگشت نیست.</p>
          <div className="category-dialog-actions">
            <button type="button" className="cancel-delete-button" onClick={() => setPendingDeleteCategory(null)}>انصراف</button>
            <button type="button" className="confirm-delete-button" onClick={confirmCategoryDelete}>حذف دسته‌بندی</button>
          </div>
        </section>
      </div>}
      {pendingDeleteService && <div className="category-dialog-backdrop service-delete-backdrop">
        <section className="category-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-service-title" aria-describedby="delete-service-description">
          <span className="delete-warning-icon"><Icon name="trash" size={21} /></span>
          <h3 id="delete-service-title">حذف خدمت؟</h3>
          <p id="delete-service-description">خدمت «{pendingDeleteService.name}» از دسته‌بندی و سبد خرید حذف می‌شود. این کار قابل بازگشت نیست.</p>
          <div className="category-dialog-actions">
            <button type="button" className="cancel-delete-button" onClick={() => setPendingDeleteService(null)}>انصراف</button>
            <button type="button" className="confirm-delete-button" onClick={confirmServiceDelete}>حذف خدمت</button>
          </div>
        </section>
      </div>}
    </section>
  )
}

function SectionPage({
  section,
  role,
  walletBalance,
  events = [],
  catalog,
  onOpenService,
  onOpenContact,
}: {
  section: string
  role: Role
  walletBalance: number
  events?: AppEvent[]
  catalog?: ServiceCatalogData
  onOpenService?: (serviceId: string) => void
  onOpenContact?: () => void
}) {
  const isServices = section === 'خدمات'
  const isEvents = section === 'رویدادها'
  const isWallet = section === 'کیف پول'
  const isAbout = section === 'درباره ما'
  const isContact = section === 'تماس با ما'
  const title = isServices
    ? 'خدماتی برای یک تجربه بهتر'
    : isEvents
      ? 'رویدادهای پیشِ رو'
      : isWallet
        ? 'کیف پول و تراکنش‌ها'
        : isAbout
          ? 'دربارهٔ ایکس‌کافه'
          : isContact
            ? 'با ما در تماس باش'
            : 'به خانه خوش آمدی'
  const description = isServices
    ? 'هر چیزی که برای رشد و ساختن نیاز داری، همین‌جاست.'
    : isEvents
      ? 'ببین چی بازه و چقدر وقت داری!'
      : isWallet
        ? 'موجودی و گردش حساب خودت را یک‌جا مدیریت کن.'
        : isAbout
          ? 'اینجا دربارهٔ فضای ایکس‌کافه و کاری که انجام می‌دهیم بیشتر بدان.'
          : isContact
            ? 'برای پرسش یا پیگیری سفارش، از راه گفت‌وگو با پشتیبانی با ما در ارتباط باش.'
            : 'فضای شخصی تو برای تجربهٔ خدمات بهتر.'
  return (
    <>
      <div className="welcome-row section-welcome">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> {section}</div><h1>{title}</h1><p>{description}</p></div>
        {!isAbout && !isContact && !isEvents && <button className="primary-button"><Icon name={isWallet ? 'plus' : 'sparkle'} size={17} />{isWallet ? 'افزایش موجودی' : 'شروع کن'}</button>}
      </div>
      {isWallet ? (
        <div className="wallet-view">
          <div className="wallet-highlight"><div><span>موجودی کیف پول شما</span><strong>{new Intl.NumberFormat('fa-IR').format(walletBalance)} <small>ریال</small></strong><p><i /> آخرین به‌روزرسانی همین حالا</p></div><span className="wallet-art"><Icon name="wallet" size={35} /></span></div>
          <div className="wallet-quick"><button><Icon name="plus" /> افزایش موجودی</button><button><Icon name="receipt" /> همه تراکنش‌ها</button></div>
          <div className="panel wallet-transaction"><h2>تراکنش‌های اخیر</h2>{orders.map((order) => <div className="transaction-row" key={order.id}><span className={`service-icon ${order.tone}`}><Icon name="receipt" size={16} /></span><div><strong>{order.service}</strong><small>{order.date}</small></div><b>− {order.amount} <small>ریال</small></b></div>)}</div>
        </div>
      ) : isEvents ? (
        <div className="event-grid" id="events-list">
          {events.length === 0 ? (
            <section className="panel event-empty">
              <span className="event-empty-icon"><Icon name="calendar" size={24} /></span>
              <h2>هنوز رویدادی ثبت نشده است</h2>
              <p>رویدادهای تازه پس از ثبت در پنل مدیریت، اینجا نمایش داده می‌شوند.</p>
            </section>
          ) : [...events].sort((first, second) => first.startDate.localeCompare(second.startDate)).map((event) => {
            const service = catalog?.services.find((item) => item.id === event.serviceId)
            const category = catalog?.categories.find((item) => item.id === event.categoryId)
              ?? catalog?.categories.find((item) => item.id === service?.categoryId)
            return (
              <AppEventCard
                key={event.id}
                event={event}
                category={category}
                service={service}
                onOpenService={onOpenService}
              />
            )
          })}
        </div>
      ) : isAbout ? (
        <section className="panel info-page-panel">
          <span className="feature-icon violet"><Icon name="users" size={22} /></span>
          <div>
            <h2>خدمات و تجربه‌ها در یک فضای ساده</h2>
            <p>ایکس‌کافه فضایی یکپارچه برای پیدا کردن و استفاده از خدمات، دنبال‌کردن رویدادها و مدیریت سفارش‌ها فراهم می‌کند؛ پشتیبانی هم برای راهنمایی همراه شماست.</p>
          </div>
        </section>
      ) : isContact ? (
        <section className="panel info-page-panel">
          <span className="feature-icon mint"><Icon name="support" size={22} /></span>
          <div>
            <h2>چطور می‌تونیم کمک کنیم؟</h2>
            <p>برای پرسش دربارهٔ خدمات یا پیگیری سفارش، از طریق گفت‌وگو با پشتیبانی با ما در ارتباط باش.</p>
            <button className="primary-button" type="button" onClick={onOpenContact}><Icon name="chat" size={17} /> گفتگو با پشتیبانی</button>
          </div>
        </section>
      ) : (
        <div className="feature-grid">{(isServices ? [
          ['طراحی و برندینگ', 'از ایده تا هویت بصری ماندگار', 'sparkle', 'violet'],
          ['توسعه وب‌سایت', 'تجربه‌ای حرفه‌ای برای کسب‌وکار تو', 'grid', 'blue'],
          ['مشاوره و پشتیبانی', 'همراهی در تمام قدم‌های مسیر', 'support', 'mint'],
        ] as [string, string, IconName, string][] : [
          ['سفارش‌های من', 'پیگیری وضعیت و جزئیات سفارش‌ها', 'receipt', 'violet'],
          ['گفتگو با پشتیبانی', 'پاسخ‌گویی سریع، همیشه کنار تو', 'chat', 'blue'],
          [`پنل ${roleLabels[role]}`, 'مدیریت حساب و تنظیمات', 'user', 'mint'],
        ] as [string, string, IconName, string][]).map(([name, text, icon, tone]) => <article className="feature-card" key={name}><span className={`feature-icon ${tone}`}><Icon name={icon} size={22} /></span><h2>{name}</h2><p>{text}</p><button>مشاهده جزئیات <Icon name="arrow" size={15} /></button></article>)}</div>
      )}
      {!isEvents && !isAbout && !isContact && <div className="section-bottom-card"><div className="note-icon"><Icon name="sparkle" /></div><div><strong>تجربه‌ای که به سلیقهٔ تو ساخته شده</strong><p>هر روز خدمات و پیشنهادهای تازه‌ای به ایکس‌کافه اضافه می‌کنیم.</p></div></div>}
    </>
  )
}

function AppEventCard({
  event,
  category,
  service,
  onOpenService,
}: {
  event: AppEvent
  category?: CatalogCategory
  service?: CatalogService
  onOpenService?: (serviceId: string) => void
}) {
  const remainingDays = daysUntil(event.endDate)
  const countdownState = remainingDays < 0 ? 'ended' : remainingDays === 0 ? 'last-day' : 'remaining'
  const countdownText = remainingDays < 0
    ? 'پایان‌یافته'
    : remainingDays === 0
      ? 'آخرین روز'
      : `${new Intl.NumberFormat('fa-IR').format(remainingDays)} روز مانده`
  const headingContent = (
    <>
      <span className="feature-icon violet"><Icon name="calendar" size={21} /></span>
      <h2>{event.title}</h2>
      {service && onOpenService && <span className="event-card-view-service">مشاهده خدمت</span>}
    </>
  )
  const content = (
    <>
      <div className="event-card-content">
        {service && onOpenService ? (
          <button
            type="button"
            className="event-card-heading event-card-heading-actionable"
            aria-label={`مشاهده خدمت ${service.name} در رویداد ${event.title}`}
            onClick={() => onOpenService(service.id)}
          >
            {headingContent}
          </button>
        ) : (
          <div className="event-card-heading">{headingContent}</div>
        )}
        <div className="event-date-grid">
          <div className="event-date-box">
            <div className="event-date-line">
              <span className="event-date-caption">تاریخ شروع</span>
              <time dateTime={event.startDate}>{formatPersianDate(event.startDate)}</time>
            </div>
          </div>
          <div className={`event-date-box event-date-box-end ${countdownState}`}>
            <span className={`event-countdown ${countdownState}`}>{countdownText}</span>
            <div className="event-date-line">
              <span className="event-date-caption">تاریخ پایان</span>
              <time dateTime={event.endDate}>{formatPersianDate(event.endDate)}</time>
            </div>
          </div>
        </div>
      </div>
      <div className="event-card-links">
        {category && <span className="event-category-action">دسته‌بندی مرتبط: {category.name}</span>}
        {service ? (
          <span className="event-service-name">خدمت مرتبط: {service.name}</span>
        ) : (
          <span className="event-unlinked-service">بدون خدمت مرتبط</span>
        )}
      </div>
    </>
  )

  return <article className="event-card">{content}</article>
}

function DemoConversationPage({
  role,
  search,
  orders: demoOrders,
  activeOrder,
  onOpenOrder,
  onSendMessage,
  catalog,
  onOfferAdditionalService,
  onStartAdditionalServicePayment,
  onCompleteAdditionalServicePayment,
  onCloseDemoConversation,
  onCancelDemoOrder,
}: {
  role: Role
  search: string
  orders: DemoOrder[]
  activeOrder: DemoOrder | null
  onOpenOrder: (orderId: string | null) => void
  onSendMessage: (orderId: string, text: string, senderRole: 'user' | 'operator', attachment?: DemoAttachment) => boolean
  catalog: ServiceCatalogData
  onOfferAdditionalService: (orderId: string, item: CartItem) => boolean
  onStartAdditionalServicePayment: (orderId: string, serviceId: string) => boolean
  onCompleteAdditionalServicePayment: (orderId: string, serviceId: string, successful: boolean) => boolean
  onCloseDemoConversation: (orderId: string) => boolean
  onCancelDemoOrder: (orderId: string) => number | null
}) {
  const isOperatorView = role !== 'user'
  const filteredOrders = demoOrders.filter((order) => {
    const searchable = `${order.userName} ${order.operatorName} ${order.items.map((item) => item.name).join(' ')}`
    return searchable.includes(search.trim())
  })

  return (
    <>
      <section className="panel demo-conversation-list">
        {filteredOrders.length === 0 ? (
          <div className="downloads-empty">
            <span className="downloads-empty-icon"><Icon name="chat" size={24} /></span>
            <h3>{search ? 'گفتگویی پیدا نشد' : 'هنوز گفتگویی نداری'}</h3>
            <p>{search ? 'عبارت جست‌وجو را تغییر بده.' : 'بعد از ثبت آزمایشی یک سفارش، نام شخص و خدمات اینجا نمایش داده می‌شوند.'}</p>
          </div>
        ) : (
          <div className="demo-conversation-rows">
            {filteredOrders.map((order) => {
              const isClosed = order.conversationStatus === 'closed'
              const isDisabled = !isOperatorView && isClosed
              return (
              <button type="button" className={`demo-conversation-row ${isDisabled ? 'disabled' : ''}`} key={order.id} disabled={isDisabled} onClick={() => {
                if (!isDisabled) onOpenOrder(order.id)
              }}>
                <span className="demo-conversation-copy">
                  <strong>{isOperatorView ? order.userName : order.operatorName}</strong>
                  <span>{order.items.map((item) => `${item.name} × ${new Intl.NumberFormat('fa-IR').format(item.quantity)}`).join('، ')}</span>
                  {isClosed && <small className="demo-conversation-closed">گفتگو بسته شده</small>}
                </span>
                <Icon name="arrow" size={16} />
              </button>
              )
            })}
          </div>
        )}
      </section>
      {activeOrder && (
        <DemoChatDialog
          key={activeOrder.id}
          order={activeOrder}
          role={role}
          catalog={catalog}
          onClose={() => onOpenOrder(null)}
          onSendMessage={onSendMessage}
          onOfferAdditionalService={onOfferAdditionalService}
          onStartAdditionalServicePayment={onStartAdditionalServicePayment}
          onCompleteAdditionalServicePayment={onCompleteAdditionalServicePayment}
          onCloseDemoConversation={onCloseDemoConversation}
          onCancelDemoOrder={onCancelDemoOrder}
        />
      )}
    </>
  )
}

function DemoChatDialog({
  order,
  role,
  catalog,
  onClose,
  onSendMessage,
  onOfferAdditionalService,
  onStartAdditionalServicePayment,
  onCompleteAdditionalServicePayment,
  onCloseDemoConversation,
  onCancelDemoOrder,
}: {
  order: DemoOrder
  role: Role
  catalog: ServiceCatalogData
  onClose: () => void
  onSendMessage: (orderId: string, text: string, senderRole: 'user' | 'operator', attachment?: DemoAttachment) => boolean
  onOfferAdditionalService: (orderId: string, item: CartItem) => boolean
  onStartAdditionalServicePayment: (orderId: string, serviceId: string) => boolean
  onCompleteAdditionalServicePayment: (orderId: string, serviceId: string, successful: boolean) => boolean
  onCloseDemoConversation: (orderId: string) => boolean
  onCancelDemoOrder: (orderId: string) => number | null
}) {
  const [draft, setDraft] = useState('')
  const [composerError, setComposerError] = useState('')
  const [operatorActionError, setOperatorActionError] = useState('')
  const [operatorActionNotice, setOperatorActionNotice] = useState('')
  const [paymentNotice, setPaymentNotice] = useState('')
  const [servicePickerOpen, setServicePickerOpen] = useState(false)
  const [cancellationWarningOpen, setCancellationWarningOpen] = useState(false)
  const [cancellationNotice, setCancellationNotice] = useState('')
  const [cancellationError, setCancellationError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const operatorDocumentInputRef = useRef<HTMLInputElement>(null)
  const isOperatorView = role !== 'user'
  const senderRole = isOperatorView ? 'operator' : 'user'
  const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (cancellationWarningOpen) setCancellationWarningOpen(false)
        else if (servicePickerOpen) setServicePickerOpen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [cancellationWarningOpen, onClose, servicePickerOpen])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.trim()) return
    if (onSendMessage(order.id, draft, senderRole)) {
      setDraft('')
      setComposerError('')
    } else {
      setComposerError('ارسال پیام انجام نشد. دوباره تلاش کنید.')
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    if (!onSendMessage(order.id, '', senderRole, { name: file.name, type: file.type || 'application/octet-stream', size: file.size })) {
      setComposerError('ارسال پیوست انجام نشد. دوباره تلاش کنید.')
    } else {
      setComposerError('')
    }
    event.currentTarget.value = ''
  }

  const handleOperatorDocumentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setOperatorActionError('')
    setOperatorActionNotice('')
    if (file.size > maxDemoDocumentSize) {
      setOperatorActionError('حجم هر مدرک باید حداکثر ۲ مگابایت باشد.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setOperatorActionError('خواندن فایل انجام نشد. دوباره تلاش کنید.')
        return
      }

      const saved = onSendMessage(order.id, `${file.name} برای شما ارسال شد.`, 'operator', {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result,
      })
      if (saved) {
        setOperatorActionNotice('مدرک در بخش دانلودهای کاربر قرار گرفت.')
      } else {
        setOperatorActionError('ذخیرهٔ مدرک انجام نشد؛ فضای ذخیره‌سازی مرورگر را بررسی کنید.')
      }
    }
    reader.onerror = () => {
      console.error('Could not read the operator document.', reader.error)
      setOperatorActionError('خواندن فایل انجام نشد. دوباره تلاش کنید.')
    }
    reader.readAsDataURL(file)
  }

  const handleOfferService = (service: CatalogService) => {
    const categoryName = catalog.categories.find((category) => category.id === service.categoryId)?.name ?? 'خدمات'
    const item: CartItem = {
      serviceId: service.id,
      categoryName,
      name: service.name,
      description: service.description,
      price: service.price,
      quantity: 1,
    }
    if (onOfferAdditionalService(order.id, item)) {
      setServicePickerOpen(false)
      setOperatorActionError('')
      setOperatorActionNotice(`«${service.name}» برای پرداخت به چت اضافه شد.`)
    } else {
      setOperatorActionError('افزودن خدمت انجام نشد. دوباره تلاش کنید.')
    }
  }

  const handleStartAdditionalServicePayment = (serviceId: string) => {
    setPaymentNotice('')
    if (onStartAdditionalServicePayment(order.id, serviceId)) {
      setComposerError('')
      setPaymentNotice('فرآیند پرداخت آغاز شد؛ نتیجهٔ پرداخت آزمایشی را انتخاب کنید.')
    } else {
      setComposerError('شروع پرداخت انجام نشد. دوباره تلاش کنید.')
    }
  }

  const handleCompleteAdditionalServicePayment = (serviceId: string, successful: boolean) => {
    setPaymentNotice('')
    if (onCompleteAdditionalServicePayment(order.id, serviceId, successful)) {
      setComposerError('')
      setPaymentNotice(successful
        ? 'پرداخت موفق بود؛ گفتگو را همین‌جا ادامه دهید.'
        : 'پرداخت ناموفق بود. می‌توانید دوباره تلاش کنید.')
    } else {
      setComposerError('ثبت نتیجهٔ پرداخت انجام نشد. دوباره تلاش کنید.')
    }
  }

  const handleCloseDemoConversation = () => {
    setOperatorActionError('')
    if (onCloseDemoConversation(order.id)) {
      onClose()
    } else {
      setOperatorActionError('بستن گفتگو ثبت نشد. دوباره تلاش کنید.')
    }
  }

  const handleConfirmDemoOrderCancellation = () => {
    setCancellationError('')
    const refundAmount = onCancelDemoOrder(order.id)
    if (refundAmount === null) {
      setCancellationError('انصراف از خدمت ثبت نشد. دوباره تلاش کنید.')
      return
    }

    setCancellationWarningOpen(false)
    setCancellationNotice(`انصراف ثبت شد؛ ${formatPrice(refundAmount)} ریال به کیف پول آزمایشی شما برگشت داده شد.`)
  }

  const displayName = isOperatorView ? order.userName : order.operatorName
  const displayInitial = displayName.trim().charAt(0)

  return (
    <div className="demo-chat-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className={`demo-chat-dialog ${isOperatorView ? 'operator-chat-layout' : ''}`} role="dialog" aria-modal="true" aria-labelledby="demo-chat-title" onMouseDown={(event) => event.stopPropagation()}>
        <aside className="demo-chat-sidebar">
          {isOperatorView && <header className="demo-sidebar-header">امکانات و جزئیات</header>}
          {isOperatorView && (
            <>
              <input ref={operatorDocumentInputRef} className="demo-chat-file-input" type="file" aria-label="انتخاب مدرک برای مشتری" onChange={handleOperatorDocumentChange} />
              <div className="demo-sidebar-actions">
                <button type="button" onClick={() => operatorDocumentInputRef.current?.click()}><Icon name="paperclip" size={16} /> ارسال مدارک برای مشتری</button>
                <button type="button" onClick={() => { setOperatorActionError(''); setOperatorActionNotice(''); setServicePickerOpen(true) }}><Icon name="plus" size={16} /> خدمات اضافه</button>
              </div>
              <small className="demo-sidebar-action-hint">حداکثر حجم هر مدرک: ۲ مگابایت</small>
              {operatorActionError && <p className="demo-sidebar-action-error" role="alert">{operatorActionError}</p>}
              {operatorActionNotice && <p className="demo-sidebar-action-notice" role="status">{operatorActionNotice}</p>}
            </>
          )}
          <section className="demo-sidebar-section">
            <h3>جزئیات سفارش</h3>
            <ul className="demo-sidebar-services">
              {order.items.map((item) => (
                <li key={item.serviceId}>
                  <span>{item.name}</span>
                  <small>تعداد: {new Intl.NumberFormat('fa-IR').format(item.quantity)}</small>
                </li>
              ))}
            </ul>
          </section>
          <section className="demo-sidebar-section">
            <h3>{isOperatorView ? 'مشخصات فرد' : 'اطلاعات سفارش'}</h3>
            <dl className="demo-sidebar-details">
              {isOperatorView ? (
                <>
                  <div><dt>نام و نام خانوادگی</dt><dd>{order.userName}</dd></div>
                  <div><dt>شماره همراه</dt><dd>{demoUserPhone}</dd></div>
                  <div><dt>کد ملی</dt><dd>ثبت نشده</dd></div>
                  <div><dt>تاریخ تولد</dt><dd>ثبت نشده</dd></div>
                </>
              ) : (
                <>
                  <div><dt>کد سفارش</dt><dd>{order.id}</dd></div>
                  <div><dt>وضعیت</dt><dd>{order.status}</dd></div>
                  <div><dt>وضعیت گفتگو</dt><dd>{order.conversationStatus === 'closed' ? 'بسته شده' : 'باز'}</dd></div>
                  <div><dt>مبلغ</dt><dd>{formatPrice(order.totalPrice)} ریال</dd></div>
                  <div><dt>پرداخت</dt><dd>آزمایشی</dd></div>
                  {order.status === 'لغو شده' && (
                    <>
                      <div><dt>خسارت کسرشده</dt><dd>{formatPrice(order.cancellationFee ?? 0)} ریال</dd></div>
                      <div><dt>بازگشت به کیف پول</dt><dd>{formatPrice(order.refundAmount ?? 0)} ریال</dd></div>
                    </>
                  )}
                </>
              )}
            </dl>
          </section>
          {role === 'user' && order.status === 'در حال انجام' && (
            <button type="button" className="demo-sidebar-cancel" onClick={() => {
              setCancellationError('')
              setCancellationWarningOpen(true)
            }}>انصراف از خدمت</button>
          )}
          {role === 'operator' && order.conversationStatus !== 'closed' && (
            <button type="button" className="demo-sidebar-complete" onClick={handleCloseDemoConversation}>اتمام خدمت و بستن</button>
          )}
          {isOperatorView && order.conversationStatus === 'closed' && (
            <p className="demo-sidebar-closed">گفتگو بسته شده</p>
          )}
        </aside>
        <div className="demo-chat-main">
          <header className="demo-chat-header">
            <div className="demo-chat-header-person">
              <span className="demo-chat-avatar">{displayInitial}</span>
              <div><h2 id="demo-chat-title">{displayName}</h2><p>{isOperatorView ? 'گفتگوی کاربر' : 'اپراتور خدمات'}</p></div>
            </div>
            <button type="button" className="demo-chat-close" aria-label="بستن گفتگو" onClick={onClose}><Icon name="close" size={19} /></button>
          </header>
          <div className="demo-chat-message-area" aria-live="polite">
            <div className="demo-chat-day-separator"><span>گفتگوی سفارش</span></div>
            {order.messages.length === 0 ? (
              <p className="demo-chat-empty">گفتگوی شما با {order.operatorName} آماده است. برای شروع پیام یا مدرک بفرستید.</p>
            ) : order.messages.map((message) => (
              <article className={`demo-chat-bubble ${message.senderRole === senderRole ? 'mine' : ''}`} key={message.id}>
                <strong>{message.senderName}</strong>
                {message.attachment && (
                  <div className="demo-chat-file">
                    <span><Icon name="receipt" size={19} /></span>
                    <div><b>{message.attachment.name}</b><small>{formatDemoFileSize(message.attachment.size)} · پیوست آزمایشی</small></div>
                  </div>
                )}
                {message.text && <p>{message.text}</p>}
                <time dateTime={message.createdAt}>{new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt))}</time>
              </article>
            ))}
            {paymentNotice && <p className="demo-chat-action-notice" role="status">{paymentNotice}</p>}
            {composerError && <p className="demo-chat-action-error" role="alert">{composerError}</p>}
            {cancellationNotice && <p className="demo-chat-action-notice" role="status">{cancellationNotice}</p>}
          </div>
          {(order.additionalServices ?? []).length > 0 && (
            <section className="demo-chat-service-area" aria-label="خدمات اضافه">
              {(order.additionalServices ?? []).map((service) => (
                <article className="demo-chat-service-offer" key={service.id}>
                  <div>
                    <strong>{service.item.name}</strong>
                    <span>{service.item.categoryName} · {formatPrice(service.item.price * service.item.quantity)} ریال</span>
                  </div>
                  {(isOperatorView || (order.status === 'در حال انجام' && service.status !== 'paid')) && (
                    <div className="demo-chat-service-controls">
                      {isOperatorView && (
                        <span className={`demo-chat-service-status ${service.status}`}>وضعیت: {service.status === 'pending'
                          ? 'منتظر پرداخت'
                          : service.status === 'processing'
                            ? 'در حال انجام'
                            : service.status === 'paid'
                              ? 'پرداخت شد'
                              : 'پرداخت ناموفق'}</span>
                      )}
                      {!isOperatorView && service.status === 'pending' && (
                        <button type="button" onClick={() => handleStartAdditionalServicePayment(service.id)}>پرداخت</button>
                      )}
                      {!isOperatorView && service.status === 'processing' && (
                        <div className="demo-chat-payment-actions">
                          <button type="button" onClick={() => handleCompleteAdditionalServicePayment(service.id, true)}>پرداخت موفق (آزمایشی)</button>
                          <button type="button" className="failed" onClick={() => handleCompleteAdditionalServicePayment(service.id, false)}>پرداخت ناموفق (آزمایشی)</button>
                        </div>
                      )}
                      {!isOperatorView && service.status === 'failed' && (
                        <button type="button" onClick={() => handleStartAdditionalServicePayment(service.id)}>تلاش مجدد</button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </section>
          )}
          <form className="demo-chat-composer" onSubmit={handleSubmit}>
            <input ref={fileInputRef} className="demo-chat-file-input" type="file" aria-label="انتخاب مدرک" onChange={handleFileChange} />
            <button type="button" className="demo-chat-attach" aria-label="پیوست مدرک" title="پیوست مدرک" onClick={() => fileInputRef.current?.click()}><Icon name="paperclip" size={20} /></button>
            <input aria-label="پیام شما" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} placeholder="پیام بنویس..." />
            <button className="demo-chat-send" type="submit" disabled={!draft.trim()} aria-label="ارسال پیام"><Icon name="arrow" size={17} /></button>
          </form>
        </div>
        {servicePickerOpen && (
          <div className="demo-service-picker-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setServicePickerOpen(false)
          }}>
            <section className="demo-service-picker" role="dialog" aria-modal="true" aria-labelledby="demo-service-picker-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <h2 id="demo-service-picker-title">افزودن خدمات به گفتگو</h2>
                <button type="button" aria-label="بستن فهرست خدمات" onClick={() => setServicePickerOpen(false)}><Icon name="close" size={18} /></button>
              </header>
              {catalog.services.length === 0 ? (
                <p className="demo-service-picker-empty">خدمتی برای افزودن وجود ندارد.</p>
              ) : (
                <div className="demo-service-picker-list">
                  {catalog.services.map((service) => (
                    <article key={service.id}>
                      <div><strong>{service.name}</strong><small>{catalog.categories.find((category) => category.id === service.categoryId)?.name ?? 'خدمات'}</small><p>{service.description}</p></div>
                      <strong>{formatPrice(service.price)} ریال</strong>
                      <button type="button" onClick={() => handleOfferService(service)}>افزودن به گفتگو</button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
        {cancellationWarningOpen && (
          <div className="demo-cancel-warning-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCancellationWarningOpen(false)
          }}>
            <section className="demo-cancel-warning" role="alertdialog" aria-modal="true" aria-labelledby="demo-cancel-warning-title" aria-describedby="demo-cancel-warning-message" onMouseDown={(event) => event.stopPropagation()}>
              <h2 id="demo-cancel-warning-title">هشدار انصراف از خدمت</h2>
              <p id="demo-cancel-warning-message">در صورت انصراف از خدمت، ۲۵٪ از مبلغ پرداختی بابت خسارت کسر می‌شود و مابقی وجه به کیف پول شما بازگردانده خواهد شد.</p>
              {cancellationError && <p className="demo-chat-action-error" role="alert">{cancellationError}</p>}
              <div>
                <button type="button" className="demo-cancel-continue" autoFocus onClick={() => setCancellationWarningOpen(false)}>ادامه می‌دم</button>
                <button type="button" className="demo-cancel-confirm" onClick={handleConfirmDemoOrderCancellation}>انصراف از انجام</button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  )
}

function PanelPage({
  page,
  role,
  search,
  catalog,
  events,
  siteStyle,
  setSiteStyle,
  addCategory,
  addService,
  updateCategory,
  deleteCategory,
  updateService,
  deleteService,
  addEvent,
  deleteEvent,
  demoOrders,
  activeDemoOrderId,
  onOpenDemoOrder,
  onSendDemoMessage,
  onOfferAdditionalService,
  onStartAdditionalServicePayment,
  onCompleteAdditionalServicePayment,
  onCloseDemoConversation,
  onCancelDemoOrder,
  walletBalance,
}: {
  page: string
  role: Role
  search: string
  catalog: ServiceCatalogData
  events: AppEvent[]
  siteStyle: SiteStyle
  setSiteStyle: (siteStyle: SiteStyle) => void
  addCategory: (category: CatalogCategory) => void
  addService: (service: CatalogService) => void
  updateCategory: (category: CatalogCategory) => void
  deleteCategory: (categoryId: string) => void
  updateService: (service: CatalogService) => void
  deleteService: (serviceId: string) => void
  addEvent: (event: AppEvent) => void
  deleteEvent: (eventId: string) => void
  demoOrders: DemoOrder[]
  activeDemoOrderId: string | null
  onOpenDemoOrder: (orderId: string | null) => void
  onSendDemoMessage: (orderId: string, text: string, senderRole: 'user' | 'operator', attachment?: DemoAttachment) => boolean
  onOfferAdditionalService: (orderId: string, item: CartItem) => boolean
  onStartAdditionalServicePayment: (orderId: string, serviceId: string) => boolean
  onCompleteAdditionalServicePayment: (orderId: string, serviceId: string, successful: boolean) => boolean
  onCloseDemoConversation: (orderId: string) => boolean
  onCancelDemoOrder: (orderId: string) => number | null
  walletBalance: number
}) {
  const [adminSettingsSection, setAdminSettingsSection] = useState<AdminSettingsSection>('profile')
  const [adminUsers, setAdminUsers] = useState(() => loadAdminPeople(adminUsersStorageKey, 'admin users'))
  const [adminOperators, setAdminOperators] = useState(() => loadAdminPeople(adminOperatorsStorageKey, 'admin operators'))
  const [addAdminPersonDialogOpen, setAddAdminPersonDialogOpen] = useState(false)
  const [editingAdminPerson, setEditingAdminPerson] = useState<AdminUser | null>(null)
  const [pendingDeleteAdminPerson, setPendingDeleteAdminPerson] = useState<AdminUser | null>(null)
  const [reportingAdminPerson, setReportingAdminPerson] = useState<AdminUser | null>(null)
  const [adminPeopleActionError, setAdminPeopleActionError] = useState('')
  const isAdminUsersPage = role === 'admin' && page === 'کاربران'
  const isAdminOperatorsPage = role === 'admin' && page === 'اپراتورها'
  const isAdminPeoplePage = isAdminUsersPage || isAdminOperatorsPage
  const adminPersonLabel = isAdminUsersPage ? 'کاربر' : 'اپراتور'
  const adminPeopleStorageKey = isAdminUsersPage ? adminUsersStorageKey : adminOperatorsStorageKey
  const adminPeople = isAdminUsersPage ? adminUsers : adminOperators
  const setAdminPeople = isAdminUsersPage ? setAdminUsers : setAdminOperators
  const pageDescriptions: Record<string, string> = {
    'کیف پول': 'موجودی و تراکنش‌های حساب خود را مدیریت کنید.',
    'کاربران': 'فهرست اعضا و وضعیت حساب‌های ایکس‌کافه.',
    'اپراتورها': 'مدیریت تیم پشتیبانی و اپراتورهای آنلاین.',
    'گفتگوها': 'پیام‌های تازه را بررسی و به گفتگوها پاسخ دهید.',
    'تنظیمات': 'تنظیمات حساب و ترجیحات پنل را تغییر دهید.',
    'سفارشات انجام‌شده': 'فهرست سفارش‌هایی که با موفقیت تکمیل شده‌اند.',
    'سفارشات': 'وضعیت و جزئیات سفارش‌های خود را پیگیری کنید.',
    'دانلودها': 'فایل‌های آمادهٔ سفارش‌های شما در این بخش قرار می‌گیرند.',
    'حساب من': 'اطلاعات شخصی و تنظیمات حساب کاربری.',
    'تنظیمات ظاهری': 'ظاهر سایت را مطابق سلیقهٔ خود انتخاب کنید.',
  }
  const list = orders
  const matching = list.filter((item) => `${item.id} ${item.service} ${item.status}`.includes(search.trim()))
  const visibleDemoOrders = demoOrders.filter((order) => role === 'operator'
    ? order.operatorId === demoOperators[0].id
    : role === 'user'
      ? order.userId === demoUserId
      : true)
  const downloadableDemoFiles = role === 'user'
    ? demoOrders.flatMap((order) => order.userId === demoUserId
      ? order.messages.flatMap((message) => {
          const attachment = message.attachment
          return message.senderRole === 'operator' && attachment?.dataUrl
            ? [{ id: message.id, orderId: order.id, name: attachment.name, size: attachment.size, dataUrl: attachment.dataUrl }]
            : []
        })
      : [])
    : []
  const selectedDemoOrder = visibleDemoOrders.find((order) => order.id === activeDemoOrderId) ?? null
  const activeDemoOrder = role === 'user' && selectedDemoOrder?.conversationStatus === 'closed'
    ? null
    : selectedDemoOrder
  const matchingAdminPeople = adminPeople.filter((person) => `${person.fullName} ${person.phone} ${person.nationalCode}`.includes(search.trim()))
  const persistAdminPeople = (nextPeople: AdminUser[], errorMessage: string): boolean => {
    try {
      localStorage.setItem(adminPeopleStorageKey, JSON.stringify(nextPeople))
    } catch (error) {
      console.error(`Could not save ${adminPersonLabel}s.`, error)
      setAdminPeopleActionError(errorMessage)
      return false
    }

    setAdminPeople(nextPeople)
    setAdminPeopleActionError('')
    return true
  }
  const handleCreateAdminPerson = (person: NewAdminUser): string | null => {
    const nationalCode = normalizeDigits(person.nationalCode)
    if (adminPeople.some((existingPerson) => normalizeDigits(existingPerson.nationalCode) === nationalCode)) {
      return 'این کد ملی قبلاً ثبت شده است.'
    }

    const nextPeople = [{
      ...person,
      id: createAdminUserId(),
      nationalCode: toPersianDigits(nationalCode),
      isOnline: false,
    }, ...adminPeople]

    if (!persistAdminPeople(nextPeople, `ذخیرهٔ ${adminPersonLabel} انجام نشد. دوباره تلاش کنید.`)) {
      return `ذخیرهٔ ${adminPersonLabel} انجام نشد. دوباره تلاش کنید.`
    }
    return null
  }
  const handleUpdateAdminPerson = (personId: string, person: NewAdminUser): string | null => {
    const nationalCode = normalizeDigits(person.nationalCode)
    if (adminPeople.some((existingPerson) => existingPerson.id !== personId && normalizeDigits(existingPerson.nationalCode) === nationalCode)) {
      return `این کد ملی قبلاً برای ${adminPersonLabel} دیگری ثبت شده است.`
    }
    if (!adminPeople.some((existingPerson) => existingPerson.id === personId)) return `${adminPersonLabel} موردنظر پیدا نشد.`

    const nextPeople = adminPeople.map((existingPerson) => existingPerson.id === personId
      ? { ...existingPerson, ...person, nationalCode: toPersianDigits(nationalCode) }
      : existingPerson)
    if (!persistAdminPeople(nextPeople, `ذخیرهٔ تغییرات ${adminPersonLabel} انجام نشد. دوباره تلاش کنید.`)) {
      return `ذخیرهٔ تغییرات ${adminPersonLabel} انجام نشد. دوباره تلاش کنید.`
    }
    return null
  }
  const handleConfirmDeleteAdminPerson = () => {
    if (!pendingDeleteAdminPerson) return
    const nextPeople = adminPeople.filter((person) => person.id !== pendingDeleteAdminPerson.id)
    if (persistAdminPeople(nextPeople, `حذف ${adminPersonLabel} انجام نشد. دوباره تلاش کنید.`)) {
      setPendingDeleteAdminPerson(null)
    }
  }

  return (
    <>
      <div className="welcome-row section-welcome"><div><div className="eyebrow"><span className="eyebrow-dot" /> پنل {roleLabels[role]}</div><h1>{page}</h1><p>{pageDescriptions[page] ?? 'خلاصهٔ فعالیت‌ها و اطلاعات حساب شما.'}</p></div>{page !== 'دانلودها' && page !== 'تنظیمات' && page !== 'تنظیمات ظاهری' && page !== 'گفتگوها' && <button className="primary-button" type="button" onClick={isAdminPeoplePage ? () => { setAdminPeopleActionError(''); setAddAdminPersonDialogOpen(true) } : undefined}><Icon name="plus" size={17} />افزودن مورد جدید</button>}</div>
      {page === 'تنظیمات' && role === 'admin' ? (
        <AdminSettingsPage
          section={adminSettingsSection}
          setSection={setAdminSettingsSection}
          siteStyle={siteStyle}
          setSiteStyle={setSiteStyle}
          role={role}
          catalog={catalog}
          events={events}
          addCategory={addCategory}
          addService={addService}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
          updateService={updateService}
          deleteService={deleteService}
          addEvent={addEvent}
          deleteEvent={deleteEvent}
        />
      ) : page === 'تنظیمات' || page === 'حساب من' ? (
        <div className="settings-stack">
          <ProfileSettings role={role} />
        </div>
      ) : page === 'تنظیمات ظاهری' ? (
        <AppearanceSettings siteStyle={siteStyle} setSiteStyle={setSiteStyle} />
      ) : page === 'کیف پول' ? (
        <SectionPage section="کیف پول" role={role} walletBalance={walletBalance} />
      ) : page === 'گفتگوها' ? (
        <DemoConversationPage
          role={role}
          search={search}
          orders={visibleDemoOrders}
          activeOrder={activeDemoOrder}
          onOpenOrder={onOpenDemoOrder}
          onSendMessage={onSendDemoMessage}
          catalog={catalog}
          onOfferAdditionalService={onOfferAdditionalService}
          onStartAdditionalServicePayment={onStartAdditionalServicePayment}
          onCompleteAdditionalServicePayment={onCompleteAdditionalServicePayment}
          onCloseDemoConversation={onCloseDemoConversation}
          onCancelDemoOrder={onCancelDemoOrder}
        />
      ) : isAdminPeoplePage ? (
        <section className="panel orders-panel panel-list admin-people-panel">
          <div className="panel-heading">
            <div>
              <h2>{isAdminUsersPage ? 'کاربران ثبت‌شده' : 'اپراتورهای ثبت‌شده'}</h2>
              <p>{new Intl.NumberFormat('fa-IR').format(adminPeople.length)} {adminPersonLabel}</p>
            </div>
          </div>
          <p className="admin-people-presence-note">وضعیت {isAdminUsersPage ? 'کاربران' : 'اپراتورها'} پس از راه‌اندازی ورود و خروج واقعی به‌روزرسانی می‌شود.</p>
          {adminPeopleActionError && !pendingDeleteAdminPerson && <p className="user-form-error admin-people-action-error" role="alert">{adminPeopleActionError}</p>}
          {adminPeople.length === 0 ? (
            <div className="downloads-empty admin-users-empty">
              <span className="downloads-empty-icon"><Icon name={isAdminUsersPage ? 'users' : 'support'} size={24} /></span>
              <h3>هنوز {isAdminUsersPage ? 'کاربری' : 'اپراتوری'} ثبت نشده</h3>
              <p>برای شروع، اولین {adminPersonLabel} را ثبت کن.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="admin-people-table">
                <thead><tr><th>نام و نام خانوادگی</th><th>شماره همراه</th><th>کد ملی</th><th>تاریخ تولد</th><th>جنسیت</th><th>وضعیت</th><th>عملیات</th></tr></thead>
                <tbody>{matchingAdminPeople.length ? matchingAdminPeople.map((person) => (
                  <tr key={person.id}>
                    <td>{person.fullName}</td>
                    <td>{person.phone}</td>
                    <td>{person.nationalCode}</td>
                    <td>{person.birthDate ? formatPersianDate(person.birthDate) : '—'}</td>
                    <td>{person.gender === 'female' ? 'زن' : person.gender === 'male' ? 'مرد' : person.gender === 'undisclosed' ? 'ترجیح می‌دهد نگوید' : '—'}</td>
                    <td><span className="status-pill admin-user-offline"><i />آفلاین</span></td>
                    <td>
                      <div className="admin-user-actions">
                        <button
                          type="button"
                          className="admin-user-action report-user-action"
                          onClick={() => setReportingAdminPerson(person)}
                        ><Icon name="receipt" size={14} /><span>گزارش کار</span></button>
                        <button
                          type="button"
                          className="admin-user-action"
                          onClick={() => {
                            setAdminPeopleActionError('')
                            setEditingAdminPerson(person)
                          }}
                        >ویرایش</button>
                        <button
                          type="button"
                          className="admin-user-action delete-user-action"
                          aria-label={`حذف ${person.fullName}`}
                          onClick={() => {
                            setAdminPeopleActionError('')
                            setPendingDeleteAdminPerson(person)
                          }}
                        ><Icon name="trash" size={14} /><span>حذف</span></button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td className="empty-row" colSpan={7}>{adminPersonLabel}ی با این عبارت پیدا نشد.</td></tr>}</tbody>
              </table>
            </div>
          )}
        </section>
      ) : page === 'دانلودها' ? (
        <section className="panel downloads-panel">
          <div className="panel-heading">
            <div><h2>فایل‌های قابل دانلود</h2><p>مدارک ارسال‌شده برای سفارش‌های شما</p></div>
          </div>
          {downloadableDemoFiles.length === 0 ? (
            <div className="downloads-empty">
              <span className="downloads-empty-icon"><Icon name="download" size={24} /></span>
              <h3>هنوز فایلی برای دانلود نداری</h3>
              <p>مدارکی که اپراتور برایت می‌فرستد، در این بخش قرار می‌گیرند.</p>
            </div>
          ) : (
            <div className="demo-download-list">
              {downloadableDemoFiles.map((file) => (
                <article className="demo-download-card" key={file.id}>
                  <div className="demo-download-copy">
                    <span className="downloads-empty-icon"><Icon name="receipt" size={19} /></span>
                    <div><strong>{file.name}</strong><small>سفارش {file.orderId} · {formatDemoFileSize(file.size)}</small></div>
                  </div>
                  <a className="demo-download-button" href={file.dataUrl} download={file.name}><Icon name="download" size={16} /> دانلود</a>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="panel orders-panel panel-list">
          <div className="panel-heading">
            <div><h2>{page === 'گفتگوها' ? 'گفتگوهای اخیر' : 'فهرست موارد'}</h2><p>{matching.length} مورد برای نمایش</p></div>
            <button className="text-button"><Icon name="grid" size={16} /> فیلترها</button>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>{page === 'گفتگوها' ? 'موضوع گفتگو' : 'عنوان'}</th><th>شناسه</th><th>تاریخ</th><th>جزئیات</th><th>وضعیت</th><th /></tr></thead>
              <tbody>{matching.map((item) => (
                <tr key={item.id}>
                  <td><div className="service-cell"><span className={`service-icon ${item.tone}`}>{item.initials}</span><strong>{item.service}<small>ایکس‌کافه</small></strong></div></td>
                  <td className="order-id">{item.id}</td><td>{item.date}</td><td className="amount-cell">{item.amount}</td>
                  <td><span className={`status-pill ${item.tone === 'purple' ? 'in-progress' : 'complete'}`}><i />{item.status}</span></td>
                  <td><button className="row-more" aria-label="گزینه‌ها"><Icon name="more" size={18} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
      {isAdminPeoplePage && (addAdminPersonDialogOpen || editingAdminPerson) && (
        <AdminUserDialog
          key={editingAdminPerson?.id ?? 'new'}
          entityLabel={adminPersonLabel}
          initialUser={editingAdminPerson}
          onClose={() => {
            setAddAdminPersonDialogOpen(false)
            setEditingAdminPerson(null)
          }}
          onSave={(person) => editingAdminPerson ? handleUpdateAdminPerson(editingAdminPerson.id, person) : handleCreateAdminPerson(person)}
        />
      )}
      {isAdminPeoplePage && pendingDeleteAdminPerson && (
        <div className="category-dialog-backdrop user-delete-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPendingDeleteAdminPerson(null)
        }}>
          <section className="category-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title" aria-describedby="delete-user-description">
            <span className="delete-warning-icon"><Icon name="trash" size={21} /></span>
            <h3 id="delete-user-title">حذف {adminPersonLabel}؟</h3>
            <p id="delete-user-description">{adminPersonLabel} «{pendingDeleteAdminPerson.fullName}» حذف می‌شود. این کار قابل بازگشت نیست.</p>
            {adminPeopleActionError && <p className="user-form-error" role="alert">{adminPeopleActionError}</p>}
            <div className="category-dialog-actions">
              <button type="button" className="cancel-delete-button" onClick={() => setPendingDeleteAdminPerson(null)}>انصراف</button>
              <button type="button" className="confirm-delete-button" onClick={handleConfirmDeleteAdminPerson}>حذف {adminPersonLabel}</button>
            </div>
          </section>
        </div>
      )}
      {isAdminPeoplePage && reportingAdminPerson && (
        <div className="category-dialog-backdrop user-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setReportingAdminPerson(null)
        }}>
          <section className="create-user-dialog user-activity-dialog" role="dialog" aria-modal="true" aria-labelledby="user-activity-title">
            <div className="create-user-dialog-heading">
              <div>
                <span className="feature-icon violet"><Icon name="receipt" size={21} /></span>
                <div>
                  <h2 id="user-activity-title">گزارش {adminPersonLabel}</h2>
                  <p>{reportingAdminPerson.fullName}</p>
                </div>
              </div>
              <button type="button" className="close-category-dialog" aria-label="بستن پنجره" onClick={() => setReportingAdminPerson(null)}>×</button>
            </div>
            <div className="user-activity-sections">
              <section>
                <h3>{isAdminUsersPage ? 'خدمات انتخاب‌شده' : 'خدمات انجام‌شده'}</h3>
                <p>{isAdminUsersPage ? 'ثبت خدمات انتخاب‌شده هنوز به فعالیت‌های این کاربر متصل نشده است.' : 'ثبت خدمات انجام‌شده هنوز به فعالیت‌های این اپراتور متصل نشده است.'}</p>
              </section>
              <section>
                <h3>{isAdminUsersPage ? 'گفتگو با اپراتورها' : 'گفتگو با کاربران'}</h3>
                <p>ثبت گفتگوها هنوز به سامانهٔ گفتگو متصل نشده است.</p>
              </section>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function AdminUserDialog({ onClose, onSave, initialUser, entityLabel }: {
  onClose: () => void
  onSave: (user: NewAdminUser) => string | null
  initialUser: AdminUser | null
  entityLabel: string
}) {
  const [fullName, setFullName] = useState(initialUser?.fullName ?? '')
  const [phone, setPhone] = useState(initialUser?.phone ?? '')
  const [nationalCode, setNationalCode] = useState(initialUser?.nationalCode ?? '')
  const [birthDate, setBirthDate] = useState(initialUser?.birthDate ?? '')
  const [gender, setGender] = useState<AdminUserGender | ''>(initialUser?.gender ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = fullName.trim()
    const cleanPhone = phone.trim()
    const cleanNationalCode = normalizeDigits(nationalCode.trim())

    if (!cleanName || !cleanPhone || !cleanNationalCode) {
      setError('نام، شماره همراه و کد ملی را وارد کنید.')
      return
    }
    if (!/^\d{10}$/.test(cleanNationalCode)) {
      setError('کد ملی باید ۱۰ رقم باشد.')
      return
    }

    const saveError = onSave({
      fullName: cleanName,
      phone: cleanPhone,
      nationalCode: cleanNationalCode,
      birthDate: birthDate || undefined,
      gender: gender || undefined,
    })
    if (saveError) {
      setError(saveError)
      return
    }
    onClose()
  }

  return (
    <div className="category-dialog-backdrop user-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="create-user-dialog" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
        <div className="create-user-dialog-heading">
          <div>
            <span className="feature-icon violet"><Icon name={entityLabel === 'کاربر' ? 'users' : 'support'} size={21} /></span>
            <div>
              <h2 id="create-user-title">{initialUser ? `ویرایش ${entityLabel}` : `افزودن ${entityLabel}`}</h2>
              <p>{initialUser ? `اطلاعات ${entityLabel} را ویرایش کنید.` : `اطلاعات ${entityLabel} جدید را وارد کنید.`}</p>
            </div>
          </div>
          <button type="button" className="close-category-dialog" aria-label="بستن پنجره" onClick={onClose}>×</button>
        </div>
        <form className="create-user-form" onSubmit={handleSubmit}>
          <label className="settings-field">
            <span>نام و نام خانوادگی</span>
            <input autoFocus autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={100} />
          </label>
          <label className="settings-field">
            <span>شماره همراه</span>
            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required maxLength={20} />
          </label>
          <label className="settings-field">
            <span>کد ملی</span>
            <input inputMode="numeric" autoComplete="off" value={nationalCode} onChange={(event) => setNationalCode(event.target.value)} required maxLength={10} />
          </label>
          <label className="settings-field">
            <span>تاریخ تولد <small>(اختیاری)</small></span>
            <DatePicker
              containerClassName="event-date-picker"
              calendar={persian}
              locale={persianFa}
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              maxDate={maxBirthDate}
              onOpenPickNewDate={false}
              value={birthDate ? dateFromIso(birthDate) : ''}
              onChange={(date) => setBirthDate(date ? dateToIso(date.toDate()) : '')}
              render={(_, openCalendar) => (
                <input
                  type="text"
                  className="event-date-input"
                  aria-label="تاریخ تولد (شمسی، اختیاری)"
                  value={birthDate ? formatPersianDateInput(birthDate) : ''}
                  placeholder="انتخاب تاریخ شمسی"
                  onClick={openCalendar}
                  onFocus={openCalendar}
                  readOnly
                />
              )}
            />
          </label>
          <label className="settings-field">
            <span>جنسیت <small>(اختیاری)</small></span>
            <select value={gender} onChange={(event) => {
              const value = event.target.value
              setGender(value === 'female' || value === 'male' || value === 'undisclosed' ? value : '')
            }}>
              <option value="">انتخاب نشده</option>
              <option value="female">زن</option>
              <option value="male">مرد</option>
              <option value="undisclosed">ترجیح می‌دهم نگویم</option>
            </select>
          </label>
          {error && <p className="user-form-error" role="alert">{error}</p>}
          <div className="user-form-actions">
            <button type="submit" className="primary-button"><Icon name={initialUser ? 'check' : 'plus'} size={16} />{initialUser ? 'ذخیره تغییرات' : `ثبت ${entityLabel}`}</button>
            <button type="button" className="user-form-cancel" onClick={onClose}>انصراف</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ProfileSettings({ role }: { role: Role }) {
  const displayName = role === 'admin' ? 'آرمان رضایی' : role === 'operator' ? 'سارا احمدی' : 'نگار محمدی'

  return (
    <div className="panel settings-panel">
      <div className="settings-avatar">
        <span className="avatar avatar-user">ن</span>
        <div><strong>{displayName}</strong><small>عضو از آبان ۱۴۰۳</small></div>
        <button className="text-button">ویرایش تصویر</button>
      </div>
      {[['نام و نام خانوادگی', demoUserName], ['ایمیل', 'negar@email.com'], ['شماره همراه', demoUserPhone]].map(([label, value]) => (
        <label className="settings-field" key={label}><span>{label}</span><input defaultValue={value} /></label>
      ))}
      <button className="primary-button settings-save">ذخیره تغییرات</button>
    </div>
  )
}

function EventManager({
  events,
  catalog,
  addEvent,
  deleteEvent,
}: {
  events: AppEvent[]
  catalog: ServiceCatalogData
  addEvent: (event: AppEvent) => void
  deleteEvent: (eventId: string) => void
}) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const availableServices = categoryId
    ? catalog.services.filter((service) => service.categoryId === categoryId)
    : catalog.services

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const eventTitle = title.trim()
    if (!eventTitle) {
      setError('عنوان رویداد را وارد کنید.')
      return
    }
    if (!isDateOnly(startDate) || !isDateOnly(endDate)) {
      setError('تاریخ شروع و پایان را انتخاب کنید.')
      return
    }
    if (startDate > endDate) {
      setError('تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد.')
      return
    }
    if (categoryId && !catalog.categories.some((category) => category.id === categoryId)) {
      setError('دسته‌بندی انتخاب‌شده دیگر در دسترس نیست.')
      return
    }
    const linkedService = catalog.services.find((service) => service.id === serviceId)
    if (serviceId && (!linkedService || (categoryId && linkedService.categoryId !== categoryId))) {
      setError('خدمت انتخاب‌شده دیگر در دسترس نیست.')
      return
    }

    addEvent({
      id: createEventId(),
      title: eventTitle,
      startDate,
      endDate,
      ...((categoryId || linkedService?.categoryId) ? { categoryId: categoryId || linkedService?.categoryId } : {}),
      ...(serviceId ? { serviceId } : {}),
    })
    setTitle('')
    setStartDate('')
    setEndDate('')
    setCategoryId('')
    setServiceId('')
    setError('')
    setSuccess('رویداد با موفقیت ثبت شد.')
  }

  return (
    <section className="catalog-manager event-manager">
      <div className="catalog-manager-heading">
        <span className="metric-icon purple"><Icon name="calendar" size={19} /></span>
        <div><h2>مدیریت رویدادها</h2><p>رویداد بسازید، تاریخ شمسی تعیین کنید و در صورت نیاز دسته‌بندی و خدمت مرتبط را انتخاب کنید.</p></div>
      </div>
      <form className="catalog-form event-form" onSubmit={handleSubmit}>
        <h3>رویداد جدید</h3>
        <label className="settings-field">
          <span>عنوان رویداد</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثلاً جشنواره خدمات پاییزی" required />
        </label>
        <div className="event-date-fields">
          <label className="settings-field">
            <span>تاریخ شروع (شمسی)</span>
            <DatePicker
              containerClassName="event-date-picker"
              calendar={persian}
              locale={persianFa}
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              onOpenPickNewDate={false}
              value={startDate ? dateFromIso(startDate) : ''}
              maxDate={endDate ? dateFromIso(endDate) : undefined}
              onChange={(date) => {
                const nextDate = date ? dateToIso(date.toDate()) : ''
                setStartDate(nextDate)
                if (nextDate && endDate && nextDate > endDate) setEndDate('')
              }}
              render={(_, openCalendar) => (
                <input
                  type="text"
                  className="event-date-input"
                  aria-label="تاریخ شروع (شمسی)"
                  value={startDate ? formatPersianDateInput(startDate) : ''}
                  placeholder="انتخاب تاریخ شمسی"
                  onClick={openCalendar}
                  onFocus={openCalendar}
                  readOnly
                />
              )}
            />
          </label>
          <label className="settings-field">
            <span>تاریخ پایان (شمسی)</span>
            <DatePicker
              containerClassName="event-date-picker"
              calendar={persian}
              locale={persianFa}
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              onOpenPickNewDate={false}
              value={endDate ? dateFromIso(endDate) : ''}
              minDate={startDate ? dateFromIso(startDate) : undefined}
              onChange={(date) => setEndDate(date ? dateToIso(date.toDate()) : '')}
              render={(_, openCalendar) => (
                <input
                  type="text"
                  className="event-date-input"
                  aria-label="تاریخ پایان (شمسی)"
                  value={endDate ? formatPersianDateInput(endDate) : ''}
                  placeholder="انتخاب تاریخ شمسی"
                  onClick={openCalendar}
                  onFocus={openCalendar}
                  readOnly
                />
              )}
            />
          </label>
        </div>
        <label className="settings-field">
          <span>دسته‌بندی مرتبط (اختیاری)</span>
          <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setServiceId('') }}>
            <option value="">بدون دسته‌بندی مرتبط</option>
            {catalog.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="settings-field">
          <span>خدمت مرتبط (اختیاری)</span>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            <option value="">بدون خدمت مرتبط</option>
            {availableServices.map((service) => <option value={service.id} key={service.id}>{service.name}</option>)}
          </select>
        </label>
        {error && <p className="catalog-feedback error" role="alert">{error}</p>}
        {success && <p className="catalog-feedback success" role="status">{success}</p>}
        <button className="primary-button catalog-submit" type="submit"><Icon name="plus" size={16} /> ثبت رویداد</button>
      </form>
      <div className="event-admin-list">
        <h3>رویدادهای ثبت‌شده <span className="category-service-count">{new Intl.NumberFormat('fa-IR').format(events.length)}</span></h3>
        {events.length === 0 ? (
          <p className="managed-empty">هنوز رویدادی ثبت نکرده‌اید.</p>
        ) : [...events].sort((first, second) => first.startDate.localeCompare(second.startDate)).map((item) => {
          const linkedService = catalog.services.find((service) => service.id === item.serviceId)
          const linkedCategory = catalog.categories.find((category) => category.id === item.categoryId)
            ?? catalog.categories.find((category) => category.id === linkedService?.categoryId)
          return (
            <article className="panel event-admin-row" key={item.id}>
              <div>
                <h4>{item.title}</h4>
                <p>{formatPersianDate(item.startDate)} تا {formatPersianDate(item.endDate)}</p>
                <small>{linkedCategory ? `دسته‌بندی مرتبط: ${linkedCategory.name}` : 'بدون دسته‌بندی مرتبط'}</small>
                <small>{linkedService ? `خدمت مرتبط: ${linkedService.name}` : 'بدون خدمت مرتبط'}</small>
              </div>
              <button type="button" className="event-delete-button" aria-label={`حذف رویداد ${item.title}`} onClick={() => deleteEvent(item.id)}><Icon name="trash" size={17} /></button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function AdminSettingsPage({
  section,
  setSection,
  siteStyle,
  setSiteStyle,
  role,
  catalog,
  events,
  addCategory,
  addService,
  updateCategory,
  deleteCategory,
  updateService,
  deleteService,
  addEvent,
  deleteEvent,
}: {
  section: AdminSettingsSection
  setSection: (section: AdminSettingsSection) => void
  siteStyle: SiteStyle
  setSiteStyle: (siteStyle: SiteStyle) => void
  role: Role
  catalog: ServiceCatalogData
  events: AppEvent[]
  addCategory: (category: CatalogCategory) => void
  addService: (service: CatalogService) => void
  updateCategory: (category: CatalogCategory) => void
  deleteCategory: (categoryId: string) => void
  updateService: (service: CatalogService) => void
  deleteService: (serviceId: string) => void
  addEvent: (event: AppEvent) => void
  deleteEvent: (eventId: string) => void
}) {
  const sections: { id: AdminSettingsSection; label: string; icon: IconName }[] = [
    { id: 'profile', label: 'مشخصات من', icon: 'user' },
    { id: 'catalog', label: 'دسته‌بندی و خدمات', icon: 'grid' },
    { id: 'events', label: 'رویدادها', icon: 'calendar' },
    { id: 'appearance', label: 'تنظیمات ظاهری', icon: 'settings' },
  ]

  return (
    <div className="admin-settings-layout">
      <nav className="admin-settings-sidebar" aria-label="بخش‌های تنظیمات مدیریت">
        {sections.map((item) => (
          <button key={item.id} type="button" className={`admin-settings-link ${section === item.id ? 'active' : ''}`} aria-current={section === item.id ? 'page' : undefined} onClick={() => setSection(item.id)}>
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="admin-settings-content">
        {section === 'profile' ? (
          <ProfileSettings role={role} />
        ) : section === 'catalog' ? (
          <CatalogManager catalog={catalog} addCategory={addCategory} addService={addService} updateCategory={updateCategory} deleteCategory={deleteCategory} updateService={updateService} deleteService={deleteService} />
        ) : section === 'events' ? (
          <EventManager events={events} catalog={catalog} addEvent={addEvent} deleteEvent={deleteEvent} />
        ) : (
          <AppearanceSettings siteStyle={siteStyle} setSiteStyle={setSiteStyle} />
        )}
      </div>
    </div>
  )
}

function AppearanceSettings({ siteStyle, setSiteStyle }: { siteStyle: SiteStyle; setSiteStyle: (siteStyle: SiteStyle) => void }) {
  const [activeTab, setActiveTab] = useState<AppearanceTab>('site')
  const [activeStyleGroup, setActiveStyleGroup] = useState<AppearanceStyleGroup>(() => siteStyle === 'simple' || siteStyle === 'glass' ? 'simple' : 'neumorphic')
  const activeStyle = siteStyleOptions.find((option) => option.id === siteStyle)
  const visibleStyleOptions = siteStyleOptions.filter((option) => activeStyleGroup === 'simple'
    ? option.id === 'simple' || option.id === 'glass'
    : option.id !== 'simple' && option.id !== 'glass')

  return (
    <>
      <div className="appearance-tabs" role="tablist" aria-label="تنظیمات ظاهری">
        <button type="button" role="tab" aria-selected={activeTab === 'site'} className={activeTab === 'site' ? 'active' : ''} onClick={() => setActiveTab('site')}>حالت سایت</button>
        <button type="button" role="tab" aria-selected={activeTab === 'header'} className={activeTab === 'header' ? 'active' : ''} onClick={() => setActiveTab('header')}>هدر و تولبار</button>
      </div>
      {activeTab === 'site' && (
        <section className="panel appearance-panel" role="tabpanel">
          <div className="panel-heading">
            <div><h2>سبک ظاهری سایت</h2><p>هر سبک را انتخاب کنید تا ظاهر کل سایت همان لحظه تغییر کند.</p></div>
          </div>
          <div className="site-style-groups" role="group" aria-label="گروه‌های سبک سایت">
            <button type="button" className="site-style-group-button" aria-pressed={activeStyleGroup === 'simple'} onClick={() => setActiveStyleGroup('simple')}>حالت ساده</button>
            <button type="button" className="site-style-group-button" aria-pressed={activeStyleGroup === 'neumorphic'} onClick={() => setActiveStyleGroup('neumorphic')}>حالت نئومورفیسم</button>
          </div>
          <div className="site-style-options" role="group" aria-label={activeStyleGroup === 'simple' ? 'سبک‌های ساده' : 'مدل‌های نئومورفیک'}>
            {visibleStyleOptions.map((option) => (
              <button key={option.id} type="button" className={`appearance-style-option ${siteStyle === option.id ? 'selected' : ''}`} aria-pressed={siteStyle === option.id} onClick={() => setSiteStyle(option.id)}>
                <span className={`site-style-preview preview-${option.id}`} aria-hidden="true"><i /><b /></span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
          <p className="appearance-current" role="status">سبک فعال: <strong>{activeStyle?.label}</strong></p>
        </section>
      )}
    </>
  )
}

export default App
