'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('Builder App', function() {

  browser.get('/');

  it('should automatically redirect to /home when location hash/fragment is empty', function() {
    expect(browser.getLocationAbsUrl()).toMatch("/home");
  });


  describe('home', function() {

    beforeEach(function() {
      browser.get('#!/home');
    });


    it('should render home when user navigates to #!/home', function() {
      expect(element.all(by.css('[ng-view] h1')).first().getText()).toMatch('Django Builder');
      expect(element.all(by.css('[ng-view] p')).first().getText()).toMatch('building things....');
    });

  });


  describe('models', function() {

    beforeEach(function() {
      browser.get('#!/models');
    });

    it('should render Project Name as a heading when user navigates to #!/models', function() {
      expect(element.all(by.css('[ng-view] h2')).first().getText()).toMatch('Project Name');
    });

  });
});
