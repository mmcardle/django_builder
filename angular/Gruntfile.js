module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            css: {
                src: [
                    'app/bower_components/html5-boilerplate/css/normalize.css',
                    'app/bower_components/html5-boilerplate/css/main.css',
                    'app/bootstrap/css/bootstrap-lumen.css',
                    'node_modules/select2-bootstrap-theme/dist/select2-bootstrap.css',
                    'app/css/app.css'
                ],
                dest: 'app/build/<%= pkg.name %>.min.css'
            },
            js: {
                src: [
                    'app/ace/mode-python2.js',
                    'app/ace/theme-dawn.js',
                    'app/tar-js/tar.js',
                    'app/bower_components/angular-ui-ace/ui-ace.min.js',
                    'app/bower_components/angular-local-storage/dist/angular-local-storage.min.js',
                    'app/js/*.js'
                ],
                dest: 'app/build/<%= pkg.name %>.min.js'
            }
        },
        cssmin: {
            css: {
                src: 'app/build/<%= pkg.name %>_combined.css',
                dest: 'app/build/<%= pkg.name %>_combined.min.css'
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
            tasks: ['concat', 'cssmin', 'uglify']
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
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.registerTask('default', ['concat:css', 'cssmin:css', 'concat:js', 'uglify:js']);

};
