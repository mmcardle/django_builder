'use strict';

const EC = protractor.ExpectedConditions;
const wait_timeout = 1000;
const modal_sleep = 5000;

var tmp = require('tmp');
const fs = require('fs');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

const test_func = function(tempfolder, virtualenv_test_cmd, python_test_cmd, fin){
  console.log(`running: ${virtualenv_test_cmd}`);
  exec(virtualenv_test_cmd, {'cwd': tempfolder}, (virtualenv_error, virtualenv_stdout, virtualenv_stderr) => {
      if (virtualenv_error) {
          throw Error("Failed to run '" + virtualenv_test_cmd + "': " + virtualenv_error)
      }
      console.log(`virtualenv_stdout: ${virtualenv_stdout}`);
      console.log(`virtualenv_stderr: ${virtualenv_stderr}`);

      console.log(`running: ${python_test_cmd}`);
      exec(python_test_cmd, {'cwd': tempfolder}, (py_error, py_stdout, py_stderr) => {
          if (py_error) {
              throw Error("Failed to run '" + python_test_cmd + "': " + py_error)
          }
          console.log(`py_stdout: ${py_stdout}`);
          console.log(`py_stderr: ${py_stderr}`);
          fin()
      });
  });
}

const create_command = function(python, tmpobj){
  var command = 'virtualenv virt-'+python+' -p '+python+' ';
  command += '&& . ' + tmpobj.name + '/virt-'+python+'/bin/activate';
  command += '&& pip install -r ' + tmpobj.name + '/requirements.txt';
  return command
}

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
            expect(element.all(by.css('[ng-view] span.label')).first().getText()).toMatch('Django 1.10.X');
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

        it('should produce a django 2.X tar file', function (done) {

            const project_name = 'project';
            const project_name_el = element(by.id('projectname'));
            project_name_el.clear();
            project_name_el.sendKeys(project_name);

            element(by.id('django2')).click();

            const add_model = element(by.id('django_builder_add_model'));
            add_model.click();

            const ok_button = element(by.buttonText('Ok'));
            browser.wait(EC.elementToBeClickable(ok_button), wait_timeout);
            ok_button.click();

            const download_as_project = element(by.id('django_builder_download_as_project'));
            browser.wait(EC.visibilityOf(download_as_project), wait_timeout);
            browser.wait(EC.elementToBeClickable(download_as_project), wait_timeout);
            browser.sleep(modal_sleep);
            download_as_project.click();

            const data_element = element(by.id('django_builder_download_a'));
            browser.wait(EC.elementToBeClickable(data_element), wait_timeout);
            data_element.click()

            const tar_element = element(by.id('django_builder_download_hidden'));

            const expected_prefix = 'data:application/tar;base64,';
            const expected_prefix_len = expected_prefix.length;

            tar_element.getAttribute('href').then(function (data_tar_base64_url) {
                expect(typeof data_tar_base64_url).toBe("string");
                expect(data_tar_base64_url.substring(0, expected_prefix_len)).toBe(expected_prefix);

                const tmpobj = tmp.dirSync();
                console.log('Dir: ', tmpobj.name);

                const filename = tmpobj.name + "/test.tar";
                const data_tar = new Buffer(data_tar_base64_url.substring(expected_prefix_len), 'base64').toString();

                fs.writeFile(filename, data_tar, function(err) {
                    if(err) {
                        throw Error("Failed to write file: "+err)
                    }
                    const tar_cmd = 'tar vfx '+ filename;

                    exec(tar_cmd, {'cwd': tmpobj.name}, (tar_error, tar_stdout, tar_stderr) => {
                        if (tar_error) {
                            throw Error("Failed to run '" + tar_cmd + "': " + tar_error)
                        }

                        console.log(`tar_stdout: ${tar_stdout}`);
                        console.log(`tar_stderr: ${tar_stderr}`);

                        const test_cmd_python3 = create_command('python3', tmpobj)
                        const python3_test_cmd = tmpobj.name + '/virt-python3/bin/python ./' + project_name + '/manage.py test ' + project_name;

                        test_func(tmpobj.name, test_cmd_python3, python3_test_cmd, done)
                    });
                });
            });
        }, 120000); // 120 second jamine timeout

        it('should produce a django 1.X tar file', function (done) {

            const project_name = 'project';
            const project_name_el = element(by.id('projectname'));
            project_name_el.clear();
            project_name_el.sendKeys(project_name);

            element(by.id('django1')).click();

            const add_model = element(by.id('django_builder_add_model'));
            add_model.click();

            const ok_button = element(by.buttonText('Ok'));
            browser.wait(EC.elementToBeClickable(ok_button), wait_timeout);
            ok_button.click();

            const download_as_project2 = element(by.id('django_builder_download_as_project'));
            browser.wait(EC.visibilityOf(download_as_project2), wait_timeout);
            browser.wait(EC.elementToBeClickable(download_as_project2), wait_timeout);
            browser.sleep(modal_sleep);
            download_as_project2.click();

            const data_element = element(by.id('django_builder_download_a'));
            browser.wait(EC.elementToBeClickable(data_element), wait_timeout);
            data_element.click()

            const tar_element = element(by.id('django_builder_download_hidden'));

            const expected_prefix = 'data:application/tar;base64,';
            const expected_prefix_len = expected_prefix.length;

            tar_element.getAttribute('href').then(function (data_tar_base64_url) {
                expect(typeof data_tar_base64_url).toBe("string");
                expect(data_tar_base64_url.substring(0, expected_prefix_len)).toBe(expected_prefix);

                const tmpobj = tmp.dirSync();
                console.log('Dir: ', tmpobj.name);

                const filename = tmpobj.name + "/test.tar";
                const data_tar = new Buffer(data_tar_base64_url.substring(expected_prefix_len), 'base64').toString();

                fs.writeFile(filename, data_tar, function(err) {
                    if(err) {
                        throw Error("Failed to write file: "+err)
                    }
                    const tar_cmd = 'tar vfx '+ filename;

                    exec(tar_cmd, {'cwd': tmpobj.name}, (tar_error, tar_stdout, tar_stderr) => {
                        if (tar_error) {
                            throw Error("Failed to run '" + tar_cmd + "': " + tar_error)
                        }

                        console.log(`tar_stdout: ${tar_stdout}`);
                        console.log(`tar_stderr: ${tar_stderr}`);

                        const test_cmd_python2 = create_command('python2', tmpobj)
                        const test_cmd_python3 = create_command('python3', tmpobj)
                        const python2_test_cmd = tmpobj.name + '/virt-python2/bin/python ./' + project_name + '/manage.py test ' + project_name;
                        const python3_test_cmd = tmpobj.name + '/virt-python3/bin/python ./' + project_name + '/manage.py test ' + project_name;

                        test_func(tmpobj.name, test_cmd_python2, python2_test_cmd, function(){
                          test_func(tmpobj.name, test_cmd_python3, python3_test_cmd, done)
                        })
                    });
                });
            });
        }, 120000); // 120 second jamine timeout
    });
});
