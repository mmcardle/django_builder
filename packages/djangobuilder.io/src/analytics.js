import { createGtag, optIn, optOut } from 'vue-gtag'

/** Turn tracking on or off for the id passed to createAnalytics. */
export function setAnalyticsEnabled(enabled) {
  if (enabled) {
    optIn()
  } else {
    optOut()
  }
}

/** Load gtag.js for `tagId` and return the Vue plugin that provides `$gtag`. */
export function createAnalytics(tagId, enabled) {
  // vue-gtag turns the automatic page view off unless its router tracker is used.
  const plugin = createGtag({ tagId, config: { send_page_view: true } })
  setAnalyticsEnabled(enabled)
  return plugin
}
