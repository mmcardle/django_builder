const path = require('path')

const node_env = import.meta.env.NODE_ENV
const minimize = node_env == 'development' ? false : true

console.log(`Environment: ${node_env}`)
console.log(`Minimise: ${minimize}`)

module.exports = {
  productionSourceMap: false,
  lintOnSave: undefined
}
