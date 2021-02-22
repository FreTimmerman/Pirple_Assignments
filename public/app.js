/*
 * Frontend logic for the application
 */

const app = {};

// Config
app.config = {
  'sessionToken': false
};

// AJAX client (for the restful API)
app.client = {};

// interface for making API calls
app.client.request = (headers, path, method, queryStringObject, payload, callback) => {

  // Set defaults
  headers = typeof headers === 'object' && headers !== null ? headers : {};
  path = typeof path === 'string' ? path : '/';
  method = typeof method === 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) >= 0 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof queryStringObject === 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof payload === 'object' && payload !== null ? payload : {};
  callback = typeof callback === 'function' ? callback : false;

  // for each querystring parameter sent, add it to the path

  let requestURL = path + '?';
  let counter = 0;
  for (let queryKey in queryStringObject) {
    counter++;
    // if at least one query string parameter has already been added, prepend new ones with an ampersand
    if (counter > 1) {
      requestURL += '&';
    }

    // add the key and value
    requestURL += queryKey + '=' + queryStringObject[queryKey];
  }

  //form the http request as a JSON type
  const xhr = new XMLHttpRequest();
  xhr.open(method, requestURL, true);
  xhr.setRequestHeader("Content-Type", 'application/json');

  // for each heacer sent, add it to the request
  for (let headerKey in headers) {
    xhr.setRequestHeader(headerKey, headers[headerKey]);
  }

  // if there is a curren tsession token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  //when the request comes back, handle the response.
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const statusCode = xhr.status;
      const responseReturned = xhr.responseText;

      // callback if requested
      if (callback) {
        try {
          const parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }
      }
    }
  }

  // send the payload as JSON
  const payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
}