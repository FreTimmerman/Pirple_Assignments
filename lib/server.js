'use strict';

//Dependencies
import http from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';
import handlers from './handlers/index.js';
import { parseJsonToObject } from './helpers.js';
import config from './config.js';

//create server object to exports
const server = {};


// Initiate the server
server.httpServer = http.createServer((req, res) => {

  // Parse the url
  const parsedUrl = url.parse(req.url, true);

  // Get the trimmed path using RegEx, trimming leading and trailing slashes
  const trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');

  // Get the querystring as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  //Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');

  // Fill the buffer when receiving data
  let buffer = '';
  req.on('data', data => buffer += decoder.write(data));

  // When the request is ended
  req.on('end', () => {

    // End the current buffer
    buffer += decoder.end();

    // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
    const chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': parseJsonToObject(buffer)
    };
    //console.log(data)
    //console.log(buffer);

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload, contentType) => {

      //Determine the type of response (default to JSON)
      contentType = typeof contentType === 'string' ? contentType : 'json';

      // Use the status code returned from the handler, or set the default status code to 200
      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // Use the payload returned from the handler, or set the default payload to an empty object

      // Return the response-parts that are content-specific
      let payloadString = '';
      if (contentType === 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof payload === 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
      }

      if (contentType === 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof payload === 'string' ? payload : '';
      }
      // Return the response-parts that are common to all content-types
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
});

// Define the request router
server.router = {
  '': handlers.index,
  'account/create': handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/deleted': handlers.accountDeleted,
  'session/create': handlers.sessionCreate, //logging in
  'session/deleted': handlers.sessionDeleted, //logging out
  'menu': handlers.showMenu, //perhaps with index?
  'order/create': handlers.orderCreate,
  'order/update': handlers.orderUpdate,
  'order/created': handlers.orderCreated,
  'ping': handlers.ping,
  'api/tokens': handlers.tokens,
  'api/menu': handlers.menu,
  'api/users': handlers.users,
  'api/cart': handlers.cart,
  'api/order': handlers.order
};

// Init script
server.init = function () {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function () {
    console.log('\x1b[36m%s\x1b[0m', 'The HTTP server is running on port ' + config.httpPort);
  });
};

export default server;