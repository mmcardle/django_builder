'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('Builder App', function() {

  browser.get('index.html');

  it('should automatically redirect to /home when location hash/fragment is empty', function() {
    expect(browser.getLocationAbsUrl()).toMatch("/home");
  });


  describe('home', function() {

    beforeEach(function() {
      browser.get('index.html#/home');
    });


    it('should render home when user navigates to /home', function() {
      expect(element.all(by.css('[ng-view] h1')).first().getText()).toMatch('Django Builder');
      expect(element.all(by.css('[ng-view] p')).first().getText()).toMatch('building things....');
    });

  });


  describe('models', function() {

    beforeEach(function() {
      browser.get('index.html#/models');
    });


    it('should render view2 when user navigates to /view2', function() {
      expect(element.all(by.css('[ng-view] h2')).first().getText()).toMatch('App Name');
    });

  });
});
