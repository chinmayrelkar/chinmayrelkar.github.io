import '../public/assets/chrome.js'
import './style.css'
import 'preline'

const root = document.documentElement
const mq = matchMedia('(prefers-color-scheme: dark)')

function preference() {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function isDark() {
  const pref = preference()
  if (pref === 'dark') return true
  if (pref === 'light') return false
  return mq.matches
}

function syncThemeToggleLabels() {
  const pref = preference()
  const label = pref === 'system' ? 'Auto' : pref === 'dark' ? 'Dark' : 'Light'
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.textContent = label
    btn.setAttribute('aria-label', `Color theme: ${label}. Click to change.`)
    btn.title = 'Cycles Light, Dark, and Auto (system)'
  })
}

function applyTheme() {
  root.classList.toggle('dark', isDark())
  syncThemeToggleLabels()
}

applyTheme()
mq.addEventListener('change', () => {
  if (preference() === 'system') applyTheme()
})

document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const order = ['system', 'light', 'dark']
    const current = preference()
    const next = order[(order.indexOf(current) + 1) % order.length]
    if (next === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', next)
    applyTheme()
  })
})

const yearEl = document.getElementById('year')
if (yearEl) yearEl.textContent = String(new Date().getFullYear())

const LOCAL_POSTS = [
  { title: 'The Evolution of the Agent Harness', link: '/presentations/the-evolution-of-agent-harness/', pubDate: '2026-08-10' },
  { title: 'Organizational Cognition', link: '/writing/organizational-cognition.html', pubDate: '2026-07-29' },
]

const MEDIUM_FALLBACK = [
  { title: 'The 8 Levels of Financial Freedom. Which One Are You?', link: 'https://chnmy.medium.com/the-8-levels-of-financial-freedom-which-one-are-you-6671e0b0882c', pubDate: '2026-05-04' },
  { title: 'Will Discounting Your SaaS Make You Rich or Destroy Your Business?', link: 'https://chnmy.medium.com/will-discounting-your-saas-make-you-rich-or-destroy-your-business-40bb34ea9071', pubDate: '2023-08-16' },
  { title: 'Engineering behind a Search Bar', link: 'https://chnmy.medium.com/engineering-behind-a-search-bar-51516504da1d', pubDate: '2023-08-09' },
  { title: 'Maximising Success with Weighted Load Balancing', link: 'https://chnmy.medium.com/maximizing-success-with-weighted-load-balancing-14898b15c2ee', pubDate: '2023-07-20' },
]

function parsePubDate(dateInput) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput)
  if (!dateOnly) return new Date(dateInput)
  return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
}

function formatTicketDate(dateInput) {
  const d = parsePubDate(dateInput)
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = String(d.getFullYear()).slice(-2)
  return `${month} '${year}`
}

function renderTicketList(list, items) {
  list.textContent = ''
  items.forEach((item) => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = item.link
    if (/^https?:\/\//.test(item.link)) {
      a.target = '_blank'
      a.rel = 'noopener'
    }
    const title = document.createElement('span')
    title.className = 'ticket-title'
    title.textContent = item.title
    const date = document.createElement('span')
    date.className = 'ticket-date'
    date.textContent = formatTicketDate(item.pubDate)
    a.append(title, date)
    li.appendChild(a)
    list.appendChild(li)
  })
}

const list = document.getElementById('ticket-list')
if (list) {
  const feedUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://chnmy.medium.com/feed')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  fetch(feedUrl, { signal: controller.signal })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad response'))))
    .then((data) => {
      if (!data.items || !data.items.length) throw new Error('empty feed')
      return data.items
    })
    .catch(() => MEDIUM_FALLBACK)
    .then((mediumItems) => {
      const combined = [...LOCAL_POSTS, ...mediumItems]
        .sort((a, b) => parsePubDate(b.pubDate) - parsePubDate(a.pubDate))
        .slice(0, 8)
      renderTicketList(list, combined)
    })
    .finally(() => clearTimeout(timeout))
}

function initReveals() {
  const nodes = [...document.querySelectorAll('[data-reveal]')]
  if (!nodes.length) return

  const show = (el) => el.classList.add('is-visible')

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach(show)
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        show(entry.target)
        io.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -4% 0px', threshold: 0.01 },
  )

  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const inView = rect.top < window.innerHeight * 0.96 && rect.bottom > 0
    if (inView) show(el)
    else io.observe(el)
  })

  // Safety: never leave content invisible if IO misses
  setTimeout(() => nodes.forEach(show), 1200)
}

initReveals()


function initScrollSpy() {
  const sideLinks = [...document.querySelectorAll('.side-link[href^="#"]')]
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')]
  const links = [...sideLinks, ...navLinks]
  if (!links.length) return

  const sections = []
  const byId = new Map()
  for (const link of sideLinks) {
    const id = link.getAttribute('href').slice(1)
    const section = document.getElementById(id)
    if (!section) continue
    sections.push(section)
    byId.set(id, { section, side: link, nav: navLinks.find((n) => n.getAttribute('href') === `#${id}`) })
  }
  if (!sections.length) return

  const rail = document.querySelector('.side-links')
  let marker = rail && rail.querySelector('.side-marker')
  if (rail && !marker) {
    marker = document.createElement('span')
    marker.className = 'side-marker'
    marker.setAttribute('aria-hidden', 'true')
    rail.prepend(marker)
  }

  const setActive = (id) => {
    links.forEach((l) => {
      const on = l.getAttribute('href') === `#${id}`
      l.classList.toggle('is-active', on)
    })
    if (marker && rail) {
      const active = byId.get(id)?.side
      if (active) {
        const top = active.offsetTop + active.offsetHeight / 2 - 2
        marker.style.transform = `translateY(${top}px)`
        marker.classList.add('is-on')
      }
    }
  }

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
      if (!visible.length) return
      setActive(visible[0].target.id)
    },
    { rootMargin: '-22% 0px -52% 0px', threshold: [0.1, 0.3, 0.55] },
  )
  sections.forEach((s) => io.observe(s))
}

function initScrollProgress() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let bar = document.querySelector('.scroll-progress')
  if (!bar) {
    bar = document.createElement('div')
    bar.className = 'scroll-progress'
    bar.setAttribute('role', 'progressbar')
    bar.setAttribute('aria-label', 'Scroll progress')
    bar.setAttribute('aria-valuemin', '0')
    bar.setAttribute('aria-valuemax', '100')
    bar.setAttribute('aria-valuenow', '0')
    document.body.prepend(bar)
  }
  const update = () => {
    const doc = document.documentElement
    const max = doc.scrollHeight - doc.clientHeight
    const p = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0
    bar.style.transform = `scaleX(${p})`
    bar.setAttribute('aria-valuenow', String(Math.round(p * 100)))
  }
  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
}

function initSectionBeats() {
  const sections = document.querySelectorAll('.about-main section, .home-hero')
  if (!sections.length) return

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sections.forEach((s) => s.classList.add('is-inview'))
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-inview')
        io.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  )
  sections.forEach((s) => io.observe(s))
}

initScrollSpy()
initScrollProgress()
initSectionBeats()

