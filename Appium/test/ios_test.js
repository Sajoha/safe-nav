'use strict';

const Setup = require('../helpers/setup.js');

let
    driver = null,
    webdriver = null;

before('suite setup', function() {
    // the webdriver takes a while to setup; mocha timeout is set to 5 minutes
    this.timeout(300000);

    const setup = new Setup();

    webdriver = setup.getWd();

    // appium local server
    driver = webdriver.promiseChainRemote({
        host: 'localhost',
        port: 4723
    });

    // turn on logging for the driver
    setup.logging(driver);

    // specify target test app and ios simulator
    return driver.init({
        automationName: 'XCUITest',
        platformName: 'iOS',
        deviceName: 'iPhone SE',
        platformVersion: '10.2',
        app: '/Users/sam/Workspace/GitHub/safe-nav/build/iphone/build/Products/Debug-iphonesimulator/safeNav.app',
        noReset: true // doesn't kill the simulator
    });
});

after('suite teardown', function() {
    return driver.quit();
});

describe('OAuthApplication', function() {
    this.timeout(300000);

    it('Should type in the text box', function() {
        return driver
            .elementById('com.shaig.safenav/id:totxt')
            .click()
            .keys('Sam!');
    });

    it('Should launch the Map', function() {
        return driver
            //.elementById('goBtn')
            .elementByName('Plot Route!')
            .click()
            .sleep(3600);
    });
});
