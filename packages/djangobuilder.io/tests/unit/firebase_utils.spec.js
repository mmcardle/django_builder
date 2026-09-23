import { emailActionContinueUrl } from '@/firebase_utils'

afterEach(() => vi.unstubAllEnvs())

test('continue url points at the legacy login when built under /legacy/', () => {
  vi.stubEnv('BASE_URL', '/legacy/')
  expect(emailActionContinueUrl()).toBe(window.location.origin + '/legacy/#/login/')
})

test('continue url points at the root login in dev', () => {
  vi.stubEnv('BASE_URL', '/')
  expect(emailActionContinueUrl()).toBe(window.location.origin + '/#/login/')
})
