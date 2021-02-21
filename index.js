// Dependencies
import server from './lib/server.js';

// Declare the app
const app = {};

// Init function
app.init = function () {

  // Start the server
  server.init();

};

// Self executing
app.init();
