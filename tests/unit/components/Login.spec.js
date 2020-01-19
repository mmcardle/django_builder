import { shallowMount } from '@vue/test-utils'
import Login from '@/components/Login.vue'

describe('Login.vue', () => {
  it('renders and has text', () => {
    const wrapper = shallowMount(Login)
    const text = wrapper.text()
    expect(text).toMatch('Login')
    expect(text).toMatch(
      "You don't have an account ? You can create one"
    )
  })
})
