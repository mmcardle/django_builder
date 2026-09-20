import { mount } from '@vue/test-utils'
import LegacyBanner from '@/components/LegacyBanner.vue'

beforeEach(() => localStorage.clear())

test('links to the new app at the site root', () => {
  const wrapper = mount(LegacyBanner)
  expect(wrapper.get('a').attributes('href')).toBe('/')
  expect(wrapper.text()).toContain('legacy Django Builder')
})

test('dismissing hides the banner and persists across mounts', async () => {
  const wrapper = mount(LegacyBanner)
  await wrapper.get('button').trigger('click')
  expect(wrapper.find('a').exists()).toBe(false)
  expect(localStorage.getItem('legacy_banner_dismissed')).toBe('true')
  expect(mount(LegacyBanner).find('a').exists()).toBe(false)
})
