'use strict';

const EC = protractor.ExpectedConditions;
const wait_timeout = 1000;

var fs = require('fs');

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

            const project_name = element(by.id('projectname'));
            project_name.clear();
            project_name.sendKeys('project');

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

            const expected_prefix = 'data:application/tar;base64';
            const expected_prefix_len = expected_prefix.length;

            data_element.getAttribute('href').then(function (data_tar_url) {
                expect(typeof data_tar_url).toBe("string");
                expect(data_tar_url.substring(0, expected_prefix_len)).toBe(expected_prefix)
            });
        });
    });
});
