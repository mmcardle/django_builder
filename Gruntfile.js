module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'node_modules/font-awesome/fonts/',
                        src: ['**'],
                        dest: './app/fonts/',
                    },
                ],
            },
        },
        concat: {
            css: {
                nonull: true,
                src: [
                    'node_modules/bootstrap/dist/css/bootstrap.min.css',
                    'node_modules/font-awesome/css/font-awesome.min.css',
                    'node_modules/select2/dist/css/select2.min.css',
                    'node_modules/html5-boilerplate/dist/css/normalize.css',
                    'node_modules/html5-boilerplate/dist/css/main.css',
                    'node_modules/select2-bootstrap-theme/dist/select2-bootstrap.css',
                    'app/bootstrap/css/bootstrap-lumen.css',
                    'app/css/app.css'
                ],
                dest: 'app/build/<%= pkg.name %>.min.css'
            },
            js: {
                nonull: true,
                src: [
                    'node_modules/html5-boilerplate/dist/js/vendor/modernizr-2.8.3.min.js',
                    'node_modules/html5-boilerplate/dist/js/vendor/jquery-3.1.0.min.js',
                    'node_modules/angular/angular.min.js',
                    'node_modules/angular-route/angular-route.min.js',
                    'node_modules/angulartics/dist/angulartics.min.js',
                    'node_modules/angulartics-google-analytics/dist/angulartics-ga.min.js',
                    'node_modules/select2/dist/js/select2.js',
                    'node_modules/angular-ui-ace/src/ui-ace.js',
                    'node_modules/angular-local-storage/dist/angular-local-storage.min.js',
                    'node_modules/bootstrap/dist/js/bootstrap.min.js',
                    'app/ace/ace-1.1.3.js',
                    'app/ace/mode-python2.js',
                    'app/ace/theme-dawn.js',
                    'app/tar-js/tar.js',
                    'app/js/*.js'
                ],
                dest: 'app/build/<%= pkg.name %>.min.js'
            }
        },
        uglify: {
            js: {
                files: {
                    'app/build/<%= pkg.name %>.min.js':
                        ['app/build/<%= pkg.name %>.min.js']
                }
            }
        },
        watch: {
            files: ['*.js', 'app/js/*.js', 'app/css/*.css'],
            tasks: ['concat',  'uglify']
        },
        karma: {
            e2e: {
                configFile: 'test/protractor-conf.js'
            },
            unit: {
                configFile: 'test/karma.conf.js',
                singleRun: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', [
        'copy:main', 'concat:css', 'concat:js', 'uglify:js'
    ]);

};
