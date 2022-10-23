
import fs from 'fs'
const settings = fs.readFileSync('src/django/python/settings.py', 'utf-8')

describe('settings.py', () => {

  it('renders', () => {
    expect(settings).toMatch('Django settings for XXX_PROJECT_NAME_XXX project')
  })

})
