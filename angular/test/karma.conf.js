module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-route/angular-route.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bootstrap/js/bootstrap.js',
      'app/ace/ace-1.1.3.js',
      'app/ace/mode-python2.js',
      'app/ace/theme-dawn.js',
      'app/tar-js/tar.js',
      'app/bower_components/angular-ui-ace/ui-ace.min.js',
      'app/bower_components/angular-local-storage/angular-local-storage.min.js',
      'app/jquery/jquery-1.8.3.js',
      'app/js/**/*.js',
      'test/unit/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
