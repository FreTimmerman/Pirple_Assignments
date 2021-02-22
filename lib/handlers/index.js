/*
 * Request Handlers
 *
 */

// Dependencies
import _users from './users.js';
import _tokens from './tokens.js';
import _menu from './menu.js';
import _cart from './cart.js';
import _order from './order.js';
import { addUniversalTemplates, getTemplate, getStaticAsset } from '../helpers.js';

// Define the handler object and export it
const handlers = {};

/*
 *
 * HTML Handlers
 * 
 */

// Index handler
handlers.index = (data, callback) => {
  // Reject any request that isn't a GET
  if (data.method === 'get') {

    // Prepare data for interpolation
    const templateData = {
      'head.title': 'title, hooray!',
      'head.description': 'meta description',
      'body.title': 'hello pizza delivery',
      'body.class': 'index'
    };

    // Read in a template as a string
    getTemplate('index', templateData, (err, str) => {
      if (!err && str) {
        // Add the universal header and footer
        addUniversalTemplates(str, templateData, (err, str) => {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });

      } else {
        callback(500, undefined, 'html');
      }
    });

  } else {
    callback(405, undefined, 'html');
  }
}

// Favicon

handlers.favicon = (data, callback) => {
  // Reject any request that isn't a GET
  if (data.method === 'get') {
    // Read in the favicon's data
    getStaticAsset('favicon.ico', (err, data) => {
      if (!err && data) {
        callback(200, data, 'favicon')
      } else {
        callback(500);
      }
    })
  } else {
    callback(405, undefined, 'html');
  }
}

// Public assets

handlers.public = (data, callback) => {
  // Reject any request that isn't a GET
  if (data.method === 'get') {
    // get the filename being requested
    const trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
    if (trimmedAssetName.length > 0) {
      getStaticAsset(trimmedAssetName, (err, data) => {
        if (!err && data) {
          // determine content type (default to plain text)
          let contentType = 'plain';
          if (trimmedAssetName.indexOf('.css') >= 0) {
            contentType = 'css';
          }
          if (trimmedAssetName.indexOf('.jpg') >= 0) {
            contentType = 'jpg';
          }
          if (trimmedAssetName.indexOf('.png') >= 0) {
            contentType = 'png';
          }
          if (trimmedAssetName.indexOf('.ico') >= 0) {
            contentType = 'favicon';
          }

          callback(200, data, contentType);
        } else {
          callback(404);
        }
      })
    } else {
      callback(404);
    }
  } else {
    callback(405, undefined, 'html');
  }
}

/*
 *
 * JSON API Handlers
 * 
 */

// Ping
handlers.ping = (data, callback) => callback(200, { "text": "PONG" });

// Not-Found
handlers.notFound = (data, callback) => callback(404, {
  "Error": "nothing here (yet?)"
});

// Users
handlers.users = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    _users[data.method](data, callback);
  } else {
    callback(405);
  }
};


// Tokens
handlers.tokens = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    _tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};


// Menu
handlers.menu = (data, callback) => {
  let acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    _menu[data.method](data, callback);
  } else {
    callback(405);
  }
};


// Cart
handlers.cart = (data, callback) => {
  let acceptableMethods = ['get', 'patch', 'post', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    _cart[data.method](data, callback);
  } else {
    callback(405);
  }
};


// Order
handlers.order = (data, callback) => {
  let acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    _order[data.method](data, callback);
  } else {
    callback(405);
  }
};


export default handlers;