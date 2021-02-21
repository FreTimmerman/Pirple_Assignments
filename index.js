'use strict';

// Dependencies
import http from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';

// Initiate the server
const server = http.createServer((req, res) => {

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
    const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {

      // Use the status code returned from the handler, or set the default status code to 200
      statusCode = typeof (statusCode) === 'number' ? statusCode : 200;

      // Use the payload returned from the handler, or set the default payload to an empty object
      payload = typeof (payload) === 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
});

server.listen(3000, () => console.log('HTTP server is running on port 3000'));

// Define all the handlers
const handlers = {};

// Hello handler
handlers.hello = (data, callback) => {
  let response = {
    'response': 'Hi There, nice to meet you!'
  }
  callback(200, response);
}

// Not-Found handler
handlers.notFound = (data, callback) => callback(404, { "error": "404 not found" });

// Define the request router
const router = {
  'hello': handlers.hello,
};
