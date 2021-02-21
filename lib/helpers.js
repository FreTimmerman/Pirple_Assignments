'use strict';

//Dependencies
import crypto from 'crypto';
import config from './config.js';
import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

//create Helpers object (is exported)

//const helpers = {};

//parse JSON to object, used in case improper JSON is used, this way we catch the error, so the server keeps going
export const parseJsonToObject = str => {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch (e) {
    console.error(e)
    return {};
  }
};

// Create a SHA256 hash
export const hash = str => {
  if (typeof (str) == 'string' && str.length > 0) {
    let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

//check via (complicated) regex if a string is a valid email address
export const isValidEmail = str => {
  if (typeof (str) == 'string' && str.length > 0) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(str).toLowerCase());
  } else {
    return false;
  }

}

export const createRandomString = strLength => {
  strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible characters that could go into a string
    let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Start the final string
    let str = '';
    for (let i = 1; i <= strLength; i++) {
      // Get a random charactert from the possibleCharacters string
      let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      // Append this character to the string
      str += randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Get the string content of a template
export const getTemplate = (templateName, callback) => {
  templateName = typeof templateName === 'string' && templateName.length > 0 ? templateName : false;
  if (templateName) {
    let templatesDirectory = path.join(__dirname, '/../templates/')
    fs.readFile(templatesDirectory + templateName + '.html', 'utf8', (err, str) => {
      if (!err && str && str.length > 0) {
        callback(false, str);
      } else {
        callback('template ' + templateName + ' was not found');
      }
    });
  } else {
    callback('a valid tempalte name was not specified')
  }
}