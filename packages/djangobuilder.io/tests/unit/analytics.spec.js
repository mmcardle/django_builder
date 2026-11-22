import { createAnalytics, setAnalyticsEnabled } from '@/analytics'

const GA_ID = 'G-TEST123456'

afterEach(() => {
  delete window.dataLayer
  delete window.gtag
  delete window[`ga-disable-${GA_ID}`]
  document.head.querySelectorAll('script, link').forEach((el) => el.remove())
})

function commands() {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry))
}

test('createAnalytics loads the gtag.js script for the given id', () => {
  createAnalytics(GA_ID, true)
  const script = document.head.querySelector('script')
  expect(script.src).toContain(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`)
})

test('createAnalytics queues a config command for the given id', () => {
  createAnalytics(GA_ID, true)
  const config = commands().find((c) => c[0] === 'config')
  expect(config[1]).toBe(GA_ID)
})

test('createAnalytics asks gtag.js to send the initial page view', () => {
  createAnalytics(GA_ID, true)
  const config = commands().find((c) => c[0] === 'config')
  expect(config[2].send_page_view).toBe(true)
})

test('createAnalytics returns a plugin that installs $gtag', () => {
  const app = { config: { globalProperties: {} } }
  createAnalytics(GA_ID, true)(app)
  expect(typeof app.config.globalProperties.$gtag.event).toBe('function')
})

test('createAnalytics leaves tracking on when enabled', () => {
  createAnalytics(GA_ID, true)
  expect(window[`ga-disable-${GA_ID}`]).toBeUndefined()
})

test('createAnalytics opts the id out when the user has disabled analytics', () => {
  createAnalytics(GA_ID, false)
  expect(window[`ga-disable-${GA_ID}`]).toBe(true)
})

test('setAnalyticsEnabled toggles the opt-out flag for the configured id', () => {
  createAnalytics(GA_ID, true)
  setAnalyticsEnabled(false)
  expect(window[`ga-disable-${GA_ID}`]).toBe(true)
  setAnalyticsEnabled(true)
  expect(window[`ga-disable-${GA_ID}`]).toBeUndefined()
})
