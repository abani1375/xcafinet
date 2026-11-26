import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'

type Role = 'user' | 'operator' | 'admin'
type ServiceView = 'categories' | 'all'
type CatalogCategory = { id: string; name: string; description: string }
type CatalogService = { id: string; categoryId: string; name: string; description: string; price: number }
type ServiceCatalogData = { categories: CatalogCategory[]; services: CatalogService[] }

const catalogStorageKey = 'xcafinet-service-catalog'
const defaultCatalog: ServiceCatalogData = {
  categories: [
    { id: 'design', name: 'طراحی و برندینگ', description: 'از ایده تا هویت بصری ماندگار' },
    { id: 'web', name: 'توسعه وب‌سایت', description: 'تجربه‌ای حرفه‌ای برای کسب‌وکار تو' },
    { id: 'support', name: 'مشاوره و پشتیبانی', description: 'همراهی در تمام قدم‌های مسیر' },
  ],
  services: [
    { id: 'design-identity', categoryId: 'design', name: 'طراحی هویت بصری', description: 'طراحی یک هویت بصری یکپارچه برای برند شما', price: 1450000 },
    { id: 'web-development', categoryId: 'web', name: 'طراحی و توسعه وب‌سایت', description: 'طراحی وب‌سایت متناسب با نیاز کسب‌وکار شما', price: 3800000 },
    { id: 'customer-support', categoryId: 'support', name: 'مشاوره و پشتیبانی', description: 'همراهی و پاسخ‌گویی به پرسش‌های شما', price: 280000 },
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
    && Number.isFinite(value.price)
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

function loadServiceCatalog(): ServiceCatalogData {
  try {
    const stored = localStorage.getItem(catalogStorageKey)
    if (stored === null) return defaultCatalog

    const parsed: unknown = JSON.parse(stored)
    if (isServiceCatalogData(parsed)) return parsed

    console.error('Stored service catalog has an invalid format; using the starter catalog.')
  } catch (error) {
    console.error('Could not load the saved service catalog.', error)
  }

  return defaultCatalog
}

function createCatalogId(type: 'category' | 'service') {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
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
}

function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  )
}

const roleLabels: Record<Role, string> = { user: 'کاربر', operator: 'اپراتور', admin: 'مدیریت' }
const navItems: { label: string; icon: IconName }[] = [
  { label: 'خدمات', icon: 'grid' },
  { label: 'خانه', icon: 'home' },
  { label: 'رویدادها', icon: 'calendar' },
  { label: 'کیف پول', icon: 'wallet' },
  { label: 'حساب کاربری', icon: 'user' },
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
  ],
  user: [
    { label: 'داشبورد', icon: 'grid' },
    { label: 'کیف پول', icon: 'wallet' },
    { label: 'سفارشات', icon: 'receipt' },
    { label: 'گفتگوها', icon: 'chat' },
    { label: 'حساب من', icon: 'user' },
  ],
}

const orders = [
  { id: 'XC-2048', service: 'مشاوره و پشتیبانی', date: 'امروز، ۱۰:۴۲', amount: '۲۸۰,۰۰۰', status: 'در حال انجام', tone: 'purple', initials: 'م' },
  { id: 'XC-2041', service: 'طراحی هویت بصری', date: '۲۵ آبان، ۱۶:۲۰', amount: '۱,۴۵۰,۰۰۰', status: 'تکمیل شده', tone: 'green', initials: 'ط' },
  { id: 'XC-2035', service: 'توسعه وب‌سایت', date: '۲۳ آبان، ۰۹:۱۵', amount: '۳,۸۰۰,۰۰۰', status: 'تکمیل شده', tone: 'blue', initials: 'و' },
]

function App() {
  const [role, setRole] = useState<Role>('user')
  const [activeNav, setActiveNav] = useState('خانه')
  const [serviceView, setServiceView] = useState<ServiceView>('all')
  const [catalog, setCatalog] = useState(loadServiceCatalog)
  const [activePage, setActivePage] = useState('داشبورد')
  const [range, setRange] = useState('این هفته')
  const [search, setSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(catalogStorageKey, JSON.stringify(catalog))
    } catch (error) {
      console.error('Could not save the service catalog.', error)
    }
  }, [catalog])

  const addCategory = (category: CatalogCategory) => {
    setCatalog((current) => ({ ...current, categories: [...current.categories, category] }))
  }

  const addService = (service: CatalogService) => {
    setCatalog((current) => ({ ...current, services: [...current.services, service] }))
  }

  const switchRole = (nextRole: Role) => {
    setRole(nextRole)
    setActivePage('داشبورد')
    setActiveNav('حساب کاربری')
  }

  const contentTitle = activeNav === 'خانه' || activeNav === 'حساب کاربری'
    ? activePage
    : activeNav
  const isServices = activeNav === 'خدمات'

  return (
    <div className={`app-shell ${isServices ? 'service-mode' : ''}`} dir="rtl">
      <header className={`topbar ${isServices ? 'topbar-service-mode' : ''}`}>
        <div className="topbar-inner">
          {!isServices && <>
            <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setActiveNav('خانه') }} aria-label="ایکس کافه، خانه">
              <span className="brand-mark"><span /></span>
              <span className="brand-name">ایکس‌کافه<span>.</span></span>
            </a>
            <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="باز کردن منو"><Icon name="grid" /></button>
          </>}
          <nav className={`main-nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="ناوبری اصلی">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`nav-link ${activeNav === item.label ? 'active' : ''}`}
                onClick={() => { setActiveNav(item.label); setMobileMenuOpen(false) }}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          {!isServices && <div className="topbar-actions">
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
              <button className="profile-chip" onClick={() => { setActiveNav('حساب کاربری'); setActivePage('داشبورد') }}>
                <span className="avatar avatar-user">ن</span>
                <span className="profile-copy"><strong>نگار محمدی</strong><small>{roleLabels[role]}</small></span>
                <span className="chevron">⌄</span>
              </button>
            </div>}
        </div>
      </header>

      {isServices ? (
        <main className="service-main">
          <ServiceCatalog catalog={catalog} view={serviceView} setView={setServiceView} search={serviceSearch} setSearch={setServiceSearch} />
        </main>
      ) : <main className="page-wrap">
        <div className="breadcrumb"><span>ایکس‌کافه</span><b>/</b><span>{activeNav}</span><b>/</b><strong>{contentTitle}</strong></div>
        <div className="workspace">
          <aside className="sidebar">
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
                  {item.label === 'گفتگوها' && <span className="side-count">۳</span>}
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
          </aside>

          <section className="dashboard">
            {activeNav !== 'خانه' && activeNav !== 'حساب کاربری' ? (
              <SectionPage section={activeNav} role={role} />
            ) : activePage === 'داشبورد' ? (
              <Dashboard role={role} range={range} setRange={setRange} search={search} setActivePage={setActivePage} setActiveNav={setActiveNav} />
            ) : (
              <PanelPage page={activePage} role={role} search={search} catalog={catalog} addCategory={addCategory} addService={addService} />
            )}
          </section>
        </div>
      </main>}
      <footer className={`mobile-bottom-nav ${isServices ? 'service-bottom-nav' : ''}`} aria-label="ناوبری اصلی پایین صفحه">
        {navItems.map((item) => <button key={item.label} className={activeNav === item.label ? 'active' : ''} onClick={() => setActiveNav(item.label)}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}
      </footer>
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
}: {
  role: Role
  range: string
  setRange: (range: string) => void
  search: string
  setActivePage: (page: string) => void
  setActiveNav: (nav: string) => void
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
        <MetricCard title={isAdmin ? 'درآمد کل' : isOperator ? 'گفتگوهای امروز' : 'موجودی کیف پول'} value={isOperator ? '۱۲' : isAdmin ? '۸۴,۲۵۰,۰۰۰' : '۲,۴۸۰,۰۰۰'} unit={isOperator ? 'گفتگو' : 'تومان'} change="+۱۲.۸٪" icon={isOperator ? 'chat' : 'wallet'} tone="purple" note={isOperator ? '۳ گفتگوی جدید' : 'نسبت به ماه گذشته'} />
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
          <div className="chart-summary"><strong>{isAdmin ? '۸۴,۲۵۰,۰۰۰' : isOperator ? '۱۲۸' : '۵,۵۳۰,۰۰۰'} <small>{isOperator ? 'گفتگو' : 'تومان'}</small></strong><span className="chart-trend"><Icon name="arrow" size={13} /> ۱۲.۸٪</span><span className="summary-caption">در مقایسه با بازهٔ قبل</span></div>
          <div className="chart-area">
            <div className="chart-y-labels"><span>۱۰ م</span><span>۷.۵ م</span><span>۵ م</span><span>۲.۵ م</span><span>۰</span></div>
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
            <div className="balance-amount">{isOperator ? '۲۸' : isAdmin ? '۱۲,۸۴۰,۰۰۰' : '۲,۴۸۰,۰۰۰'} <small>{isOperator ? 'گفتگو' : 'تومان'}</small></div>
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
                <td className="order-id">{order.id}</td><td>{order.date}</td><td className="amount-cell">{order.amount} <small>تومان</small></td>
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
}: {
  catalog: ServiceCatalogData
  view: ServiceView
  setView: (view: ServiceView) => void
  search: string
  setSearch: (search: string) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const query = search.trim().toLocaleLowerCase('fa-IR')
  const matchingCategories = catalog.categories.filter((category) => (
    `${category.name} ${category.description}`.toLocaleLowerCase('fa-IR').includes(query)
  ))
  const visibleServices = catalog.services.filter((service) => {
    const category = catalog.categories.find((item) => item.id === service.categoryId)
    const matchesCategory = selectedCategory === null || service.categoryId === selectedCategory
    const matchesSearch = `${service.name} ${service.description} ${category?.name ?? ''}`
      .toLocaleLowerCase('fa-IR')
      .includes(query)

    return matchesCategory && matchesSearch
  })

  return (
    <>
      <div className="service-tabs" role="tablist" aria-label="نمایش خدمات">
        <button role="tab" aria-selected={view === 'categories'} className={view === 'categories' ? 'active' : ''} onClick={() => { setView('categories'); setSelectedCategory(null) }}>دسته‌بندی</button>
        <button role="tab" aria-selected={view === 'all'} className={view === 'all' ? 'active' : ''} onClick={() => { setView('all'); setSelectedCategory(null) }}>همه خدمات</button>
      </div>
      <label className="service-search">
        <Icon name="search" size={18} />
        <input aria-label="جست‌وجو در خدمات" placeholder="جست‌وجو در خدمات و دسته‌بندی‌ها..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      {view === 'categories' ? (
        <div className="service-grid">
          {matchingCategories.map((category, index) => {
            const count = catalog.services.filter((service) => service.categoryId === category.id).length
            const tone = ['violet', 'blue', 'mint'][index % 3]

            return <article className="service-card" key={category.id}>
              <span className={`feature-icon ${tone}`}><Icon name="grid" size={22} /></span>
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <div className="category-card-footer">
                <span>{new Intl.NumberFormat('fa-IR').format(count)} خدمت</span>
                <button onClick={() => { setSelectedCategory(category.id); setView('all') }}>دیدن خدمات <Icon name="arrow" size={15} /></button>
              </div>
            </article>
          })}
          {matchingCategories.length === 0 && <p className="catalog-empty">دسته‌بندی‌ای با این عبارت پیدا نشد.</p>}
        </div>
      ) : (
        <div className="service-grid">
          {visibleServices.map((service, index) => {
            const category = catalog.categories.find((item) => item.id === service.categoryId)
            const tone = ['violet', 'blue', 'mint'][index % 3]

            return <article className="service-card" key={service.id}>
              <span className={`feature-icon ${tone}`}><Icon name="sparkle" size={22} /></span>
              <span className="service-category-label">{category?.name ?? 'خدمات'}</span>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
              <div className="service-card-footer">
                <strong>{new Intl.NumberFormat('fa-IR').format(service.price)} <small>تومان</small></strong>
                <button>مشاهده جزئیات <Icon name="arrow" size={15} /></button>
              </div>
            </article>
          })}
          {visibleServices.length === 0 && <p className="catalog-empty">خدمتی با این عبارت پیدا نشد.</p>}
        </div>
      )}
    </>
  )
}

function CatalogManager({
  catalog,
  addCategory,
  addService,
}: {
  catalog: ServiceCatalogData
  addCategory: (category: CatalogCategory) => void
  addService: (service: CatalogService) => void
}) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceCategoryId, setServiceCategoryId] = useState(catalog.categories[0]?.id ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = categoryName.trim()
    if (!name) {
      setError('نام دسته‌بندی را وارد کنید.')
      setSuccess('')
      return
    }
    if (catalog.categories.some((category) => category.name.toLocaleLowerCase('fa-IR') === name.toLocaleLowerCase('fa-IR'))) {
      setError('این دسته‌بندی قبلاً ساخته شده است.')
      setSuccess('')
      return
    }

    const category = { id: createCatalogId('category'), name, description: categoryDescription.trim() }
    addCategory(category)
    setServiceCategoryId(category.id)
    setCategoryName('')
    setCategoryDescription('')
    setError('')
    setSuccess(`دسته‌بندی «${name}» ساخته شد.`)
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
    })
    setServiceName('')
    setServiceDescription('')
    setServicePrice('')
    setError('')
    setSuccess(`خدمت «${name}» به «${category.name}» اضافه شد.`)
  }

  return (
    <section className="catalog-manager">
      <div className="catalog-manager-heading">
        <span className="metric-icon purple"><Icon name="grid" size={19} /></span>
        <div><h2>مدیریت دسته‌بندی و خدمات</h2><p>دسته‌بندی بسازید، خدمت و قیمت آن را ثبت کنید.</p></div>
      </div>
      <div className="catalog-manager-forms">
        <form className="catalog-form" onSubmit={handleAddCategory}>
          <h3>دسته‌بندی جدید</h3>
          <label className="settings-field"><span>نام دسته‌بندی</span><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="مثلاً طراحی و برندینگ" required /></label>
          <label className="settings-field"><span>توضیحات (اختیاری)</span><input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="توضیح کوتاهی درباره این دسته" /></label>
          <button className="primary-button catalog-submit" type="submit"><Icon name="plus" size={16} /> ساخت دسته‌بندی</button>
        </form>

        <form className="catalog-form" onSubmit={handleAddService}>
          <h3>خدمت جدید</h3>
          <label className="settings-field"><span>دسته‌بندی</span><select value={serviceCategoryId} onChange={(event) => setServiceCategoryId(event.target.value)} required disabled={catalog.categories.length === 0}><option value="" disabled>انتخاب دسته‌بندی</option>{catalog.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          <label className="settings-field"><span>نام خدمت</span><input value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="مثلاً طراحی لوگو" required /></label>
          <label className="settings-field"><span>توضیحات خدمت (اختیاری)</span><input value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value)} placeholder="شرح کوتاه خدمت" /></label>
          <label className="settings-field"><span>قیمت (تومان)</span><input type="number" min="1" step="1" inputMode="numeric" value={servicePrice} onChange={(event) => setServicePrice(event.target.value)} placeholder="مثلاً ۵۰۰۰۰۰" required /></label>
          <button className="primary-button catalog-submit" type="submit" disabled={catalog.categories.length === 0}><Icon name="plus" size={16} /> ثبت خدمت</button>
        </form>
      </div>
      {error && <p className="catalog-feedback error" role="alert">{error}</p>}
      {success && <p className="catalog-feedback success" role="status">{success}</p>}
      <div className="managed-categories">
        <h3>دسته‌بندی‌های ثبت‌شده <span>{new Intl.NumberFormat('fa-IR').format(catalog.categories.length)}</span></h3>
        {catalog.categories.map((category) => {
          const categoryServices = catalog.services.filter((service) => service.categoryId === category.id)

          return <article className="managed-category" key={category.id}>
            <div className="managed-category-heading">
              <span className="feature-icon violet"><Icon name="grid" size={18} /></span>
              <div><strong>{category.name}</strong><small>{category.description || 'بدون توضیحات'}</small></div>
              <span className="category-service-count">{new Intl.NumberFormat('fa-IR').format(categoryServices.length)} خدمت</span>
            </div>
            {categoryServices.length > 0 ? <div className="managed-service-list">
              {categoryServices.map((service) => <div className="managed-service" key={service.id}><span>{service.name}</span><strong>{new Intl.NumberFormat('fa-IR').format(service.price)} <small>تومان</small></strong></div>)}
            </div> : <p className="managed-empty">هنوز خدمتی در این دسته ثبت نشده است.</p>}
          </article>
        })}
        {catalog.categories.length === 0 && <p className="managed-empty">هنوز دسته‌بندی‌ای نساخته‌اید.</p>}
      </div>
    </section>
  )
}

function SectionPage({ section, role }: { section: string; role: Role }) {
  const isServices = section === 'خدمات'
  const isEvents = section === 'رویدادها'
  const isWallet = section === 'کیف پول'
  const title = isServices ? 'خدماتی برای یک تجربه بهتر' : isEvents ? 'رویدادهای پیشِ رو' : isWallet ? 'کیف پول و تراکنش‌ها' : 'به خانه خوش آمدی'
  const description = isServices ? 'هر چیزی که برای رشد و ساختن نیاز داری، همین‌جاست.' : isEvents ? 'دورهمی‌ها و اتفاق‌های تازهٔ جامعهٔ ایکس‌کافه را از دست نده.' : isWallet ? 'موجودی و گردش حساب خودت را یک‌جا مدیریت کن.' : 'فضای شخصی تو برای تجربهٔ خدمات بهتر.'
  return (
    <>
      <div className="welcome-row section-welcome"><div><div className="eyebrow"><span className="eyebrow-dot" /> {section}</div><h1>{title}</h1><p>{description}</p></div><button className="primary-button"><Icon name={isEvents ? 'calendar' : isWallet ? 'plus' : 'sparkle'} size={17} />{isEvents ? 'تقویم رویدادها' : isWallet ? 'افزایش موجودی' : 'شروع کن'}</button></div>
      {isWallet ? (
        <div className="wallet-view">
          <div className="wallet-highlight"><div><span>موجودی کیف پول شما</span><strong>۲,۴۸۰,۰۰۰ <small>تومان</small></strong><p><i /> آخرین به‌روزرسانی همین حالا</p></div><span className="wallet-art"><Icon name="wallet" size={35} /></span></div>
          <div className="wallet-quick"><button><Icon name="plus" /> افزایش موجودی</button><button><Icon name="receipt" /> همه تراکنش‌ها</button></div>
          <div className="panel wallet-transaction"><h2>تراکنش‌های اخیر</h2>{orders.map((order) => <div className="transaction-row" key={order.id}><span className={`service-icon ${order.tone}`}><Icon name="receipt" size={16} /></span><div><strong>{order.service}</strong><small>{order.date}</small></div><b>− {order.amount} <small>تومان</small></b></div>)}</div>
        </div>
      ) : (
        <div className="feature-grid">{(isServices ? [
          ['طراحی و برندینگ', 'از ایده تا هویت بصری ماندگار', 'sparkle', 'violet'],
          ['توسعه وب‌سایت', 'تجربه‌ای حرفه‌ای برای کسب‌وکار تو', 'grid', 'blue'],
          ['مشاوره و پشتیبانی', 'همراهی در تمام قدم‌های مسیر', 'support', 'mint'],
        ] as [string, string, IconName, string][] : isEvents ? [
          ['دورهمی خلاقانه', '۳۰ آبان · پنج‌شنبه، ساعت ۱۸', 'sparkle', 'violet'],
          ['کارگاه تجربه کاربری', '۵ آذر · سه‌شنبه، ساعت ۱۶', 'grid', 'blue'],
          ['شب شبکه‌سازی', '۱۲ آذر · پنج‌شنبه، ساعت ۱۹', 'users', 'mint'],
        ] as [string, string, IconName, string][] : [
          ['سفارش‌های من', 'پیگیری وضعیت و جزئیات سفارش‌ها', 'receipt', 'violet'],
          ['گفتگو با پشتیبانی', 'پاسخ‌گویی سریع، همیشه کنار تو', 'chat', 'blue'],
          [`پنل ${roleLabels[role]}`, 'مدیریت حساب و تنظیمات', 'user', 'mint'],
        ] as [string, string, IconName, string][]).map(([name, text, icon, tone]) => <article className="feature-card" key={name}><span className={`feature-icon ${tone}`}><Icon name={icon} size={22} /></span><h2>{name}</h2><p>{text}</p><button>مشاهده جزئیات <Icon name="arrow" size={15} /></button></article>)}</div>
      )}
      <div className="section-bottom-card"><div className="note-icon"><Icon name="sparkle" /></div><div><strong>تجربه‌ای که به سلیقهٔ تو ساخته شده</strong><p>هر روز خدمات و پیشنهادهای تازه‌ای به ایکس‌کافه اضافه می‌کنیم.</p></div></div>
    </>
  )
}

function PanelPage({
  page,
  role,
  search,
  catalog,
  addCategory,
  addService,
}: {
  page: string
  role: Role
  search: string
  catalog: ServiceCatalogData
  addCategory: (category: CatalogCategory) => void
  addService: (service: CatalogService) => void
}) {
  const pageDescriptions: Record<string, string> = {
    'کیف پول': 'موجودی و تراکنش‌های حساب خود را مدیریت کنید.',
    'کاربران': 'فهرست اعضا و وضعیت حساب‌های ایکس‌کافه.',
    'اپراتورها': 'مدیریت تیم پشتیبانی و اپراتورهای آنلاین.',
    'گفتگوها': 'پیام‌های تازه را بررسی و به گفتگوها پاسخ دهید.',
    'تنظیمات': 'تنظیمات حساب و ترجیحات پنل را تغییر دهید.',
    'سفارشات انجام‌شده': 'فهرست سفارش‌هایی که با موفقیت تکمیل شده‌اند.',
    'سفارشات': 'وضعیت و جزئیات سفارش‌های خود را پیگیری کنید.',
    'حساب من': 'اطلاعات شخصی و تنظیمات حساب کاربری.',
  }
  const list = page.includes('سفارش') ? orders : page === 'گفتگوها' ? [
    { id: 'CH-108', service: 'مشاوره دربارهٔ سفارش طراحی', date: 'امروز، ۱۱:۰۸', amount: 'پاسخ جدید', status: 'آنلاین', tone: 'purple', initials: 'م' },
    { id: 'CH-104', service: 'پیگیری وضعیت سفارش', date: 'امروز، ۰۹:۳۵', amount: '۴ پیام', status: 'در انتظار', tone: 'blue', initials: 'ع' },
    { id: 'CH-099', service: 'راهنمایی برای شروع', date: 'دیروز، ۱۸:۱۲', amount: 'بسته‌شده', status: 'تکمیل', tone: 'green', initials: 'ر' },
  ] : orders
  const matching = list.filter((item) => `${item.id} ${item.service} ${item.status}`.includes(search.trim()))
  return (
    <>
      <div className="welcome-row section-welcome"><div><div className="eyebrow"><span className="eyebrow-dot" /> پنل {roleLabels[role]}</div><h1>{page}</h1><p>{pageDescriptions[page] ?? 'خلاصهٔ فعالیت‌ها و اطلاعات حساب شما.'}</p></div><button className="primary-button"><Icon name={page === 'گفتگوها' ? 'chat' : 'plus'} size={17} />{page === 'گفتگوها' ? 'گفتگوی تازه' : 'افزودن مورد جدید'}</button></div>
      {page === 'تنظیمات' || page === 'حساب من' ? (
        <div className="settings-stack">
          <div className="panel settings-panel">
            <div className="settings-avatar">
              <span className="avatar avatar-user">ن</span>
              <div><strong>{role === 'admin' ? 'آرمان رضایی' : role === 'operator' ? 'سارا احمدی' : 'نگار محمدی'}</strong><small>عضو از آبان ۱۴۰۳</small></div>
              <button className="text-button">ویرایش تصویر</button>
            </div>
            {[['نام و نام خانوادگی', 'نگار محمدی'], ['ایمیل', 'negar@email.com'], ['شماره همراه', '۰۹۱۲ ۳۴۵ ۶۷۸۹']].map(([label, value]) => (
              <label className="settings-field" key={label}><span>{label}</span><input defaultValue={value} /></label>
            ))}
            <button className="primary-button settings-save">ذخیره تغییرات</button>
          </div>
          {page === 'تنظیمات' && role === 'admin' && <CatalogManager catalog={catalog} addCategory={addCategory} addService={addService} />}
        </div>
      ) : page === 'کیف پول' ? (
        <SectionPage section="کیف پول" role={role} />
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
    </>
  )
}

export default App
