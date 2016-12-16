module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
        'node_modules/angular/angular.js',
        'node_modules/angular-route/angular-route.js',
        'node_modules/angular-mocks/angular-mocks.js',
        'app/jquery/jquery-1.8.3.js',
        'app/bootstrap/js/bootstrap.js',
        'app/ace/ace-1.1.3.js',
        'app/ace/mode-python2.js',
        'app/ace/theme-dawn.js',
        'app/tar-js/tar.js',
        'node_modules/angular-ui-ace/src/ui-ace.js',
        'node_modules/angular-local-storage/dist/angular-local-storage.min.js',
        'node_modules/angulartics/dist/angulartics.min.js',
        'node_modules/angulartics-google-analytics/dist/angulartics-ga.min.js',
        'node_modules/select2/dist/js/select2.min.js',
        'app/js/**/*.js',
        'test/unit/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : [
        'Chrome',
        'Firefox',
    ],

    plugins : [
        'karma-chrome-launcher',
        'karma-firefox-launcher',
        'karma-phantomjs-launcher',
        'karma-jasmine',
        'karma-junit-reporter',
        'karma-coverage'
    ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    },

    reporters : ['coverage', 'progress', 'junit', 'dots'],
    preprocessors : {
        'app/js/*.js': 'coverage'
    }
  });
};
