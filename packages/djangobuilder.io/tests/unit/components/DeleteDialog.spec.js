import { shallowMount } from '@vue/test-utils'
import DeleteDialog from '@/components/DeleteDialog.vue'
import { vi } from 'vitest';

describe('DeleteDialog.vue', () => {

  test('renders with default headline and text', () => {
    const wrapper = shallowMount(DeleteDialog)
    expect(wrapper.find("span").text()).toContain('Delete?')
    expect(wrapper.find("span").text()).toContain('mdi-delete')
    expect(wrapper.text()).toContain('Are you sure you wish to delete?')
  })

  test('renders with set headline and text', () => {
    const headline = 'Delete dialog headline'
    const text = 'Delete dialog text'
    const wrapper = shallowMount(DeleteDialog, {
      propsData: {
        'headline': headline,
        'text': text
      }
    })
    expect(wrapper.find("span").text()).toContain(headline)
    expect(wrapper.find("span").text()).toContain('mdi-delete')
    expect(wrapper.text()).toContain(text)
  })

  test('has ok method', () => {
    const ok = vi.fn()
    const wrapper = shallowMount(DeleteDialog, {
      propsData: {ok: ok}
    })
    expect(ok).not.toHaveBeenCalled()
    expect(wrapper.vm.deletedialog).toBeTruthy()
    wrapper.vm.do_ok()
    expect(ok).toHaveBeenCalled()
    expect(wrapper.vm.deletedialog).not.toBeTruthy()
  })

  test('has cancel method', () => {
    const cancel = vi.fn()
    const wrapper = shallowMount(DeleteDialog, {
      propsData: {cancel: cancel}
    })
    expect(cancel).not.toHaveBeenCalled()
    expect(wrapper.vm.deletedialog).toBeTruthy()
    wrapper.vm.do_cancel()
    expect(cancel).toHaveBeenCalled()
    expect(wrapper.vm.deletedialog).not.toBeTruthy()
  })
})
