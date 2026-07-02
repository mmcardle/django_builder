import { createApp } from 'vue'
import vuetify from '@/plugins/vuetify'
import MessageDialog from '@/components/MessageDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import UpgradeDialog from '@/components/UpgradeDialog.vue'
import DeleteDialog from '@/components/DeleteDialog.vue'
import FormDialog from '@/components/FormDialog.vue'

const mountDialog = function (Component, props) {
  const app = createApp(Component, props)
  app.use(vuetify)
  return app.mount(document.createElement('div'))
}

const showMessageDialog = function (headline, text, ok) {
  mountDialog(MessageDialog, { headline: headline, text: text, ok: ok })
}

const showConfirmDialog = function (headline, text, ok, cancel = () => {}, options) {
  mountDialog(ConfirmDialog, { headline: headline, text: text, ok: ok, cancel: cancel, options: options })
}

const showUpgradeDialog = function (upgrade, ok, cancel = () => {}) {
  mountDialog(UpgradeDialog, { upgrade: upgrade, ok: ok, cancel: cancel })
}

const showDeleteDialog = function (text, ok, cancel = () => {}) {
  mountDialog(DeleteDialog, { text: text, ok: ok, cancel: cancel })
}

const showFormDialog = function (headline, ok, schema, formdata, extra) {
  mountDialog(FormDialog, {
    headline: headline,
    ok: (formdata2) => {
      // Remove all undefined values
      console.debug("Raw formdata", formdata2)
      Object.keys(formdata2).forEach(key => {
        if (formdata2[key] === undefined) {
          delete formdata2[key];
        }
      });
      console.debug("Cleaned formdata", JSON.parse(JSON.stringify(formdata2)))
      return ok(formdata2)
    },
    schema: schema,
    formdata: formdata || {},
    extra: extra
  })
}

export {
  showMessageDialog, showConfirmDialog, showUpgradeDialog, showDeleteDialog,
  showFormDialog
}
