module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
        'app/bower_components/angular/angular.js',
        'app/bower_components/angular-route/angular-route.js',
        'app/bower_components/angular-mocks/angular-mocks.js',
        'app/jquery/jquery-1.8.3.js',
        'app/bootstrap/js/bootstrap.js',
        'app/ace/ace-1.1.3.js',
        'app/ace/mode-python2.js',
        'app/ace/theme-dawn.js',
        'app/tar-js/tar.js',
        'app/bower_components/angular-ui-ace/ui-ace.min.js',
        'app/bower_components/angular-local-storage/dist/angular-local-storage.min.js',
        'app/bower_components/angulartics/dist/angulartics.min.js',
        'app/bower_components/angulartics/dist/angulartics-ga.min.js',
        'app/bower_components/angulartics-google-analytics/dist/angulartics-google-analytics.min.js',
        'node_modules/select2/dist/js/select2.min.js',
        'app/js/**/*.js',
        'test/unit/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : [
        'Chrome',
        'Firefox',
        'PhantomJS'
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
