/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  'sessionToken': false
};

// initialize Stripe
var stripe;
var clientsecret;

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function (headers, path, method, queryStringObject, payload, callback) {

  // Set defaults
  headers = typeof (headers) == 'object' && headers !== null ? headers : {};
  path = typeof (path) == 'string' ? path : '/';
  method = typeof (method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE', 'PATCH'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof (payload) == 'object' && payload !== null ? payload : {};
  callback = typeof (callback) == 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path + '?';
  var counter = 0;
  for (var queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;
      // If at least one query string parameter has already been added, preprend new ones with an ampersand
      if (counter > 1) {
        requestUrl += '&';
      }
      // Add the key and value
      requestUrl += queryKey + '=' + queryStringObject[queryKey];
    }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for (var headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // If there is a current session token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      var statusCode = xhr.status;
      var responseReturned = xhr.responseText;

      // Callback if requested
      if (callback) {
        try {
          var parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }

      }
    }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

// Bind the logout button
app.bindLogoutButton = function () {
  document.getElementById("logoutButton").addEventListener("click", function (e) {

    // Stop it from redirecting anywhere
    e.preventDefault();

    // Log the user out
    app.logUserOut();

  });
};

app.addToCart = (item, remark) => {
  item = typeof item === 'string' ? item : false;
  if (item) {
    app.client.request(undefined, 'api/cart', 'GET', undefined, undefined, function (statusCode, responsePayload) {
      const cartBody = {
        'name': item,
        'remark': remark
      }
      // if no cart exists, create a new one (POST)
      if (statusCode === 500) {
        app.client.request(undefined, 'api/cart', 'POST', undefined, cartBody, function (statusCode, responsePayload) {
          if (statusCode === 200) {
            app.showCartCount();
          }
        })
      }
      // if a cart exists, add to it (PATCH)
      if (statusCode === 200) {
        app.client.request(undefined, 'api/cart', 'PATCH', undefined, cartBody, function (statusCode, responsePayload) {
          if (statusCode === 200) {
            app.showCartCount();
          }

        })
      }
    })
  }
}

app.removeFromCart = (index) => {
  index = typeof parseInt(index) == 'number' ? parseInt(index) : false;
  if (index >= 0) {

    app.client.request(undefined, 'api/cart', 'GET', undefined, undefined, function (statusCode, responsePayload) {
      if (statusCode === 200) {
        let cart = responsePayload.items;
        // if there are more than 1 item in cart, send a PUT
        if (cart.length > 1) {
          //remove the item from the cartdata
          cart.splice(index, 1)

          //we don't need to send the price, we know that in our backend.
          const cartBody = {
            'items': cart.map(item => {
              delete item.price;
              return item;
            })
          };
          //send the new cartdata as PUT
          app.client.request(undefined, 'api/cart', 'PUT', undefined, cartBody, function (statusCode, responsePayload) {
            if (statusCode === 200) {

              app.showCartCount();
              app.loadShowCartPage();
            }
          });

        } else {
          // if only 1 item in cart, send DELETE
          app.client.request(undefined, 'api/cart', 'DELETE', undefined, undefined, function (statusCode, responsePayload) {
            if (statusCode === 200) {
              app.loadShowCartPage();
              document.querySelector("#cartMenuButton").style.visibility = 'hidden';
            }
          });
        }

      }
    })
  }
}

// show the amount of items in the cart as bubble in the navbar
app.showCartCount = () => {
  if (app.config.sessionToken) {
    app.client.request(undefined, 'api/cart', 'GET', undefined, undefined, function (statusCode, responsePayload) {
      if (responsePayload && statusCode === 200) {
        count = responsePayload.items.length;

        if (count > 0) {
          document.querySelector("#cartMenuButton").innerHTML = count;
          document.querySelector("#cartMenuButton").style.visibility = 'visible';
        } else {
          document.querySelector("#cartMenuButton").style.visibility = 'hidden';
        }
      } else {
        document.querySelector("#cartMenuButton").style.visibility = 'hidden';
      }
    });
  }
}

// Log the user out then redirect them
app.logUserOut = function (redirectUser) {
  // Set redirectUser to default to true
  redirectUser = typeof (redirectUser) == 'boolean' ? redirectUser : true;

  // Get the current token id
  var tokenId = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    'id': tokenId
  };
  app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined, function (statusCode, responsePayload) {
    // Set the app.config token as false
    app.setSessionToken(false);

    // Send the user to the logged out page
    if (redirectUser) {
      window.location = '/session/deleted';
    }

  });
};

// Bind the forms
app.bindForms = function () {
  if (document.querySelector("form")) {

    var allForms = document.querySelectorAll("form");
    for (var i = 0; i < allForms.length; i++) {
      allForms[i].addEventListener("submit", function (e) {

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#" + formId + " .formError").style.display = 'none';

        // Hide the success message (if it's currently shown due to a previous error)
        if (document.querySelector("#" + formId + " .formSuccess")) {
          document.querySelector("#" + formId + " .formSuccess").style.display = 'none';
        }


        // Turn the inputs into a payload
        var payload = {};
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].type !== 'submit') {
            // Determine class of element and set value accordingly
            var classOfElement = typeof (elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
            var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
            var elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            var nameOfElement = elements[i].name;
            if (nameOfElement == '_method') {
              method = valueOfElement;
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if (nameOfElement == 'httpmethod') {
                nameOfElement = 'method';
              }
              // Create an payload field named "id" if the elements name is actually uid
              if (nameOfElement == 'uid') {
                nameOfElement = 'id';
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if (classOfElement.indexOf('multiselect') > -1) {
                if (elementIsChecked) {
                  payload[nameOfElement] = typeof (payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }

            }
          }
        }


        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == 'DELETE' ? payload : {};

        // Call the API
        app.client.request(undefined, path, method, queryStringObject, payload, function (statusCode, responsePayload) {
          // Display an error on the form if needed
          if (statusCode !== 200) {

            if (statusCode == 403) {
              // log the user out
              app.logUserOut();

            } else {

              // Try to get the error from the api, or set a default error message
              var error = typeof (responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

              // Set the formError field with the error text
              document.querySelector("#" + formId + " .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
              document.querySelector("#" + formId + " .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId, payload, responsePayload);
          }

        });
      });
    }
  }
};

// Form response processor
app.formResponseProcessor = function (formId, requestPayload, responsePayload) {
  var functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if (formId == 'accountCreate') {
    // Take the email and password, and use it to log the user in
    var newPayload = {
      'email': requestPayload.email,
      'password': requestPayload.password
    };

    app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload, function (newStatusCode, newResponsePayload) {
      // Display an error on the form if needed
      if (newStatusCode !== 200) {

        // Set the formError field with the error text
        document.querySelector("#" + formId + " .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        // Show (unhide) the form error field on the form
        document.querySelector("#" + formId + " .formError").style.display = 'block';

      } else {
        // If successful, set the token and redirect the user
        app.setSessionToken(newResponsePayload);
        window.location = '/menu';
      }
    });
  }
  // If login was successful, set the token in localstorage and redirect the user
  if (formId == 'sessionCreate') {
    app.setSessionToken(responsePayload);
    window.location = '/menu';
  }

  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2', 'checksEdit1'];
  if (formsWithSuccessMessages.indexOf(formId) > -1) {
    document.querySelector("#" + formId + " .formSuccess").style.display = 'block';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if (formId == 'accountEdit3') {
    app.logUserOut(false);
    window.location = '/account/deleted';
  }

  // If the user just created a new check successfully, redirect back to the dashboard
  if (formId == 'checksCreate') {
    window.location = '/menu';
  }

  // If the user just deleted a check, redirect them to the dashboard
  if (formId == 'checksEdit2') {
    window.location = '/menu';
  }

};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function () {
  var tokenString = localStorage.getItem('token');
  if (typeof (tokenString) == 'string') {
    try {
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if (typeof (token) == 'object') {
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    } catch (e) {
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function (add) {
  var target = document.querySelector("body");
  if (add) {
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function (token) {
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token', tokenString);
  if (typeof (token) == 'object') {
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Renew the token
app.renewToken = function (callback) {
  var currentToken = typeof (app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
  if (currentToken) {
    // Update the token with a new expiration
    var payload = {
      'id': currentToken.id,
      'extend': true,
    };
    app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, function (statusCode, responsePayload) {
      // Display an error on the form if needed
      if (statusCode == 200) {
        // Get the new token details
        var queryStringObject = { 'id': currentToken.id };
        app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {
          // Display an error on the form if needed
          if (statusCode == 200) {
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Load data on the page
app.loadDataOnPage = function () {
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof (bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for account settings page
  if (primaryClass == 'accountEdit') {
    app.loadAccountEditPage();
  }

  // Logic for the menu page
  if (primaryClass == 'showMenu') {
    app.loadShowMenuPage();
  }

  // Logic for check details page
  if (primaryClass == 'showCart') {
    app.loadShowCartPage();
  }

  // Logic for order page
  if (primaryClass == 'showOrder') {
    app.loadShowOrderPage();
  }

  // Logic for order completion page
  if (primaryClass == 'showOrderComplete') {
    app.loadShowOrderCompletePage();
  }

};

// Load the account edit page specifically
app.loadAccountEditPage = function () {
  // Get the emailr from the current token, or log the user out if none is there
  var email = typeof (app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if (email) {
    // Fetch the user data
    var queryStringObject = {
      'email': email
    };
    app.client.request(undefined, 'api/users', 'GET', queryStringObject, undefined, function (statusCode, responsePayload) {
      if (statusCode == 200) {

        // Put the data into the forms as values where needed
        document.querySelector("#accountEdit1 .firstNameInput").value = responsePayload.firstName;
        document.querySelector("#accountEdit1 .lastNameInput").value = responsePayload.lastName;
        document.querySelector("#accountEdit1 .displayEmailInput").value = responsePayload.email;
        document.querySelector("#accountEdit1 .addressInput").value = responsePayload.address;
        document.querySelector("#accountEdit1 .zipInput").value = responsePayload.zip;

        // Put the hidden email field into both forms
        var hiddenEmailInputs = document.querySelectorAll("input.hiddenEmailInput");
        for (var i = 0; i < hiddenEmailInputs.length; i++) {
          hiddenEmailInputs[i].value = responsePayload.email;
        }

      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

// Load the menu page specifically
app.loadShowMenuPage = function () {
  // Get the email from the current token, or log the user out if none is there
  var token = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;
  if (token) {
    // Fetch the menu data


    // get all the menu items
    app.client.request(undefined, 'api/menu', 'GET', undefined, undefined, (statusCode, responsePayload) => {
      if (statusCode === 200) {

        // show the menu in a nice list
        const table = document.getElementById("menuTable");

        for (let menuItem in responsePayload) {
          let tr = table.insertRow(-1);

          tr.classList.add('menuRow');
          const td0 = tr.insertCell(0);
          const td1 = tr.insertCell(1);
          const td2 = tr.insertCell(2);
          const td3 = tr.insertCell(3);
          td0.innerHTML = `<div class='itemname'>${responsePayload[menuItem].name}</div><div class='itemdescription'>${responsePayload[menuItem].ingredients.join(", ")}</div>`;

          td1.innerHTML = responsePayload[menuItem].price;
          td2.innerHTML = "<input type='text' id='menuItem" + menuItem + "' placeholder='remark'/>";

          td3.innerHTML = '<a href="#">Add to Cart</a>'; // TODO this could be a nice icon
          td3.addEventListener("click", function (e) {
            // Stop it from redirecting anywhere
            e.preventDefault();
            // add item to cart

            app.addToCart(responsePayload[menuItem].name, document.querySelector("#menuItem" + menuItem).value);
            document.querySelector("#menuItem" + menuItem).value = "";
          });
        }

      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

// Load the cart page specifically
app.loadShowCartPage = function () {
  // Get the email from the current token, or log the user out if none is there
  var token = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;
  if (token) {

    // prepare the table
    const table = document.getElementById("cartTable");
    table.innerHTML = '  <tr> \
          <th>name</th> \
          <th>remark</th> \
          <th>€</th>\
          <th></th>\
          </tr>';

    // Fetch the menu data

    // get all the menu items
    app.client.request(undefined, 'api/cart', 'GET', undefined, undefined, (statusCode, responsePayload) => {

      if (responsePayload && statusCode === 200) {
        const cartItems = responsePayload.items;
        // show the menu in a nice list

        for (let cartItem in cartItems) {
          let tr = table.insertRow(-1);
          tr.classList.add('menuRow');
          const td0 = tr.insertCell(0);
          const td1 = tr.insertCell(1);
          const td2 = tr.insertCell(2);
          const td3 = tr.insertCell(3);
          td0.innerHTML = cartItems[cartItem].name;
          td1.innerHTML = cartItems[cartItem].remark; // TODO this could be an inputfield with eventlistner
          td2.innerHTML = cartItems[cartItem].price;
          td3.innerHTML = '<a href="#">Remove from Cart</a>'; // TODO this could be a nice icon
          td3.addEventListener("click", function (e) {

            // Stop it from redirecting anywhere
            e.preventDefault();

            // add item to cart
            app.removeFromCart(cartItem);

          });
        }

      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        //app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

app.confirmPayment = (cardElement, clientName) => {
  stripe.confirmCardPayment(clientsecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: clientName,
      },
    },
  })
    .then(function (result) {
      // Handle result.error or result.paymentIntent
      if (result.error) {
        console.log(result.error);
      } else {

        if (result.paymentIntent.status === "succeeded") {
          const payload = {
            'paymentIntentID': result.paymentIntent.id,
            'remark': document.querySelector("#orderRemark").value
          };
          app.client.request(undefined, 'api/order', 'POST', undefined, payload, (statusCode, responsePayload) => {
            if (responsePayload && statusCode === 200) {
              window.location = '/order/created?waitTime=' + responsePayload.WaitTime;
            }
          });
        }
      }
    });
}


app.loadShowOrderPage = () => {
  // Get the email from the current token, or log the user out if none is there
  var token = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;
  if (token) {

    let elements = stripe.elements();
    let cardElement = elements.create('card');
    cardElement.mount('#card-element');

    // prepare the table
    const table = document.getElementById("orderTable");
    table.innerHTML = '  <tr> \
        <th>name</th> \
        <th>remark</th> \
        <th>€</th>\
        </tr>';

    // Fetch the cart data

    // get all the cart items
    app.client.request(undefined, 'api/cart', 'GET', undefined, undefined, (statusCode, responsePayload) => {
      if (responsePayload && statusCode === 200) {
        const userEmail = responsePayload.user;
        const cartItems = responsePayload.items;

        // show the menu in a nice list
        let total = 0;
        for (let cartItem in cartItems) {
          let tr = table.insertRow(-1);
          tr.classList.add('menuRow');
          const td0 = tr.insertCell(0);
          const td1 = tr.insertCell(1);
          const td2 = tr.insertCell(2);

          td0.innerHTML = cartItems[cartItem].name;
          td1.innerHTML = cartItems[cartItem].remark;
          td2.innerHTML = cartItems[cartItem].price;
          total += cartItems[cartItem].price;
        }

        document.querySelector("#totalPrice").innerHTML = total;


        // get an order, to receive the clientsecret all the cart items
        app.client.request(undefined, 'api/order', 'GET', undefined, undefined, (statusCode, responsePayload) => {
          if (responsePayload && statusCode === 200) {
            clientsecret = responsePayload.client_secret;
          }
        });
        document.querySelector("#confirmPayment").addEventListener("click", function (e) {

          // Stop it from redirecting anywhere
          e.preventDefault();

          // add item to cart
          app.confirmPayment(cardElement, userEmail);

        });
      }
    });

  } else {
    app.logUserOut();
  }
}

app.loadShowOrderCompletePage = () => {
  // Get the email from the current token, or log the user out if none is there
  var token = typeof (app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  if (token) {
    const urlParams = new URLSearchParams(window.location.search);
    const waitTime = urlParams.get('waitTime');
    document.querySelector("#waitTime").innerHTML = waitTime;
  } else {
    app.logUserOut();
  }
}

// Loop to renew token often
app.tokenRenewalLoop = function () {
  setInterval(function () {
    app.renewToken(function (err) {
      if (!err) {
        console.log("Token renewed successfully @ " + Date.now());
      }
    });
  }, 1000 * 60);
};

// Init (bootstrapping)
app.init = function () {

  // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  // Load data on page
  app.loadDataOnPage();

  // Show cart count (if any)
  app.showCartCount();

};

// Call the init processes after the window loads
window.onload = function () {
  stripe = Stripe('pk_test_51IMUBkFS5QH3zEzPoJpTWfIlyjQwrDi8UAZ9M3iua75QZwDstignQFD7iqpULj0zdZ8u4waGKpV5HOKVcz6l2emB00A9ZEdgxE');
  app.init();
};
