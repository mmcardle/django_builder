'use strict';

const EC = protractor.ExpectedConditions;
const wait_timeout = 1000;

const fs = require('fs');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('Builder App', function () {

    browser.get('/');

    it('should automatically redirect to /home when location hash/fragment is empty', function () {
        expect(browser.getLocationAbsUrl()).toMatch("/home");
    });

    describe('home', function () {

        beforeEach(function () {
            browser.get('#!/home');
        });

        it('should render home when user navigates to #!/home', function () {
            expect(element.all(by.css('[ng-view] h1')).first().getText()).toMatch('Django Builder');
            expect(element.all(by.css('[ng-view] p')).first().getText()).toMatch('building things....');
        });

    });

    describe('models', function () {

        beforeEach(function () {
            browser.get('#!/models');
        });

        it('should render Project Name as a heading when user navigates to #!/models', function () {
            expect(element.all(by.css('[ng-view] h2')).first().getText()).toMatch('Project Name');
        });

        it('should produce a tar file', function () {

            const project_name = 'project';
            const project_name_el = element(by.id('projectname'));
            project_name_el.clear();
            project_name_el.sendKeys(project_name);

            const add_model = element(by.id('django_builder_add_model'));
            add_model.click();

            const ok_button = element(by.buttonText('Ok'));
            browser.wait(EC.elementToBeClickable(ok_button), wait_timeout);
            ok_button.click();

            const download_as_project = element(by.id('django_builder_download_as_project'));
            browser.wait(EC.visibilityOf(download_as_project), wait_timeout);
            browser.wait(EC.elementToBeClickable(download_as_project), wait_timeout);
            download_as_project.click();

            const data_element = element(by.id('django_builder_download_a'));
            browser.wait(EC.elementToBeClickable(data_element), wait_timeout);

            const expected_prefix = 'data:application/tar;base64,';
            const expected_prefix_len = expected_prefix.length;

            data_element.getAttribute('href').then(function (data_tar_base64_url) {
                expect(typeof data_tar_base64_url).toBe("string");
                expect(data_tar_base64_url.substring(0, expected_prefix_len)).toBe(expected_prefix);

                const filename = "/tmp/test.tar";
                const data_tar = new Buffer(data_tar_base64_url.substring(expected_prefix_len), 'base64').toString();

                fs.writeFile(filename, data_tar, function(err) {
                    if(err) {
                        throw Error("Failed to write file: "+err)
                    }
                    const tar_cmd = 'tar vfx '+ filename;

                    exec(tar_cmd, {'cwd': '/tmp/'}, (tar_error, tar_stdout, tar_stderr) => {
                        if (tar_error) {
                            throw Error("Failed to run '"+tar_cmd+"': "+tar_err)
                        }
                        console.log(`stdout: ${tar_stdout}`);
                        console.log(`stderr: ${tar_stderr}`);

                        // TODO - virtual env?
                        const python_test_cmd = 'python ./manage.py';
                        const project_dir = "/tmp/"+project_name+"/";

                        exec(python_test_cmd, {'cwd': project_dir}, (py_error, py_stdout, py_stderr) => {
                            if (py_error) {
                                throw Error("Failed to run '"+python_test_cmd+"': "+py_error)
                            }
                            console.log(`stdout: ${py_stdout}`);
                            console.log(`stderr: ${py_stderr}`);
                        });

                    });
                });
            });
        });
    });
});
