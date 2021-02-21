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


// Define the handler object and export it
const handlers = {};

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
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users = _users;



// Tokens
handlers.tokens = (data, callback) => {
  let acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = _tokens;


// Menu
handlers.menu = (data, callback) => {
  let acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the menu methods
handlers._menu = _menu;


// Cart
handlers.cart = (data, callback) => {
  let acceptableMethods = ['get', 'patch', 'post', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._cart[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the cart methods
handlers._cart = _cart;

// Order
handlers.order = (data, callback) => {
  let acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._order[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the cart methods
handlers._order = _order;


export default handlers;