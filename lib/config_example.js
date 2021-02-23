/*
 *
 * example config file, edit these parameters and save to config.js
 * 
 */
'use strict';

//create config object
const config = {
  'hashingSecret': 'thisIsASecret',
  'tokenlength': 35,
  'httpPort': 3000,
  'stripeSecretKey': 'sk_test_ABCDEFG',
  'mailgunSecretKey': 'key-test_ABCDEFG',
  'mailgunDomain': 'sandboxABCDEFG.mailgun.org',
  'templateGlobals': {
    'appName': 'my cool app',
    'companyName': 'my asesome company',
    'yearCreated': '2021',
    'baseUrl': 'http://localhost:' + httpPort + '/'
  }
};

export default config;