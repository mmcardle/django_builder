import settings from '@/django/python/settings.py'

describe('settings.py', () => {

  it('renders', () => {
    expect(settings).toMatch('Django settings for XXX_PROJECT_NAME_XXX project')
  })

})
