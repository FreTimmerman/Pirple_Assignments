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
  'mailgunSecretKey': 'pk_test_ABCDEFG',
  'mailgunDomain': 'sandboxABCDEFG.mailgun.org'
};

export default config;