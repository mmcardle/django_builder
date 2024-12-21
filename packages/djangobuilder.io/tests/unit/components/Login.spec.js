import { mount } from '@vue/test-utils'
import Login from '@/components/Login.vue'

test('mount component', async () => {
  expect(true).toBeTruthy()

  const wrapper = mount(Login, {
    props: {
      count: 4,
    },
  })

  expect(wrapper.html()).toMatchSnapshot()

  // Mock firebase
  // await wrapper.get('v-btn').trigger('click')

})
