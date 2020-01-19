import Vue from 'vue'
import MessageDialog from '@/components/MessageDialog'
import ConfirmDialog from '@/components/ConfirmDialog'
import UpgradeDialog from '@/components/UpgradeDialog'
import DeleteDialog from '@/components/DeleteDialog'
import FormDialog from '@/components/FormDialog'

const showMessageDialog = function (headline, text, ok, color) {
  var MessageDialogClass = Vue.extend(MessageDialog)
  var dialog = new MessageDialogClass({
    propsData: { headline: headline, text: text, ok: ok, color: color }
  })
  dialog.$mount()
}

const showConfirmDialog = function (headline, text, ok, cancel = () => {}, options) {
  var ConfirmDialogClass = Vue.extend(ConfirmDialog)
  var dialog = new ConfirmDialogClass({
    propsData: { headline: headline, text: text, ok: ok, cancel: cancel, options: options }
  })
  dialog.$mount()
}

const showUpgradeDialog = function (upgrade, ok, cancel = () => {}) {
  var UpgradeDialogClass = Vue.extend(UpgradeDialog)
  var dialog = new UpgradeDialogClass({
    propsData: { upgrade: upgrade, ok: ok, cancel: cancel }
  })
  dialog.$mount()
}

const showDeleteDialog = function (text, ok, cancel = () => {}) {
  var DeleteDialogClass = Vue.extend(DeleteDialog)
  var dialog = new DeleteDialogClass({
    propsData: { text: text, ok: ok, cancel: cancel }
  })
  dialog.$mount()
}

const showFormDialog = function (headline, ok, schema, formdata) {
  var FormDialogClass = Vue.extend(FormDialog)
  var dialog = new FormDialogClass({
    propsData: {
      headline: headline,
      ok: ok,
      schema: schema,
      formdata: formdata || {}
    }
  })
  dialog.$mount()
}

export {
  showMessageDialog, showConfirmDialog, showUpgradeDialog, showDeleteDialog,
  showFormDialog
}
