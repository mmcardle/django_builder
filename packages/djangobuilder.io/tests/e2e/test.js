module.exports = {
  'Basic Render Test' : function (browser) {
    browser
      .url(browser.launchUrl)
      .waitForElementVisible('body')
      .assert.titleContains('Django Builder')
      .assert.visible('#django_builder')
      .end();
  }
};