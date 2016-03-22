exports.config = {
  allScriptsTimeout: 11000,

  specs: [
    'e2e/*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  seleniumAddress: 'http://localhost:4444/wd/hub',
  baseUrl: 'http://localhost:8020/app/',

  framework: 'jasmine2',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
