exports.config = {
  allScriptsTimeout: 11000,

  specs: [
    'e2e/*.js'
  ],

  capabilities: {
    'browserName': 'firefox'
  },

  //multiCapabilities: [
    //{'browserName': 'chrome'},
    //{'browserName': 'firefox'}
  //],

  baseUrl: 'http://localhost:8020/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
