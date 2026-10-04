import './style.css'
import 'preline'

const root = document.documentElement
const stored = localStorage.getItem('theme')
if (stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches)) {
  root.classList.add('dark')
}

document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = root.classList.contains('dark') ? 'light' : 'dark'
    root.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
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
    li.className = 'group'
    const a = document.createElement('a')
    a.href = item.link
    a.className = 'flex items-baseline justify-between gap-4 py-4 hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50'
    if (/^https?:\/\//.test(item.link)) {
      a.target = '_blank'
      a.rel = 'noopener'
    }
    const title = document.createElement('span')
    title.className = 'font-medium'
    title.textContent = item.title
    const date = document.createElement('span')
    date.className = 'shrink-0 text-sm text-neutral-500'
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
