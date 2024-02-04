module.exports = {
  'Login as Anonymous' : function (browser) {
    browser.url(browser.launchUrl).waitForElementVisible('body');

    browser.click("css selector", '#splash_login')
  }
};