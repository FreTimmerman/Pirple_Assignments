import _data from '../data.js';
import _tokens from './tokens.js';

const _cart = {}

// Cart - post
// Required data (as payload): menu-item
// Required header: token
// Optional data (as payload): remark
_cart.post = (data, callback) => {
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  let item = typeof (data.payload.item) == 'string' ? data.payload.item : false;
  let remark = typeof (data.payload.remark) == 'string' ? data.payload.remark : "no remarks";
  // Verify that the given token is valid, and get the user's email
  _tokens.verifyToken(token, userEmail => {
    if (userEmail) {
      //check if this user already has an active cart
      _data.read('cart', userEmail, (err, cartdata) => {
        if (err) { //if no active cart, continue
          //try to read the item from the menu
          _data.read('menu', item, (err, menudata) => {
            if (err) { //it does not exist
              callback(405, {
                "error": "item does not exist in menu"
              });
            } else { //it exists, continue
              //check if the item is available
              if (menudata.available) {
                let newcart = {};
                newcart.items = [];
                let newitem = {};
                newitem.name = item;
                newitem.remark = remark;
                newitem.price = menudata.price;
                newcart.items.push(newitem);
                newcart.total = menudata.price;
                newcart.user = userEmail;
                newcart.waitTime = menudata.prepareTime;
                //console.log(newcart);
                _data.create('cart', userEmail, newcart, err => { //create the cart with email as identifier
                  if (err) {
                    callback(500, {
                      "error": "could not find an existing cart"
                    });
                  } else {
                    callback(200, newcart);
                  }
                });
              } else {
                callback(405, {
                  "error": "item is not available in menu"
                });
              }
            }
          });
        } else { //if an active cart, callback an error and the actual cart
          callback(405, {
            "error": "There are already items in the cart, use PUT instead to add an item",
            "cart": cartdata
          });
        }

      });
    } else {
      callback(400, {
        "error": "Invalid Token"
      });
    }
  });
}

// Cart - Get
// Required data: token
// Optional data: none
_cart.get = (data, callback) => {
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  // Verify that the given token is valid for the email address
  _tokens.verifyToken(token, userEmail => {
    if (userEmail) {
      _data.read('cart', userEmail, (err, cartdata) => {
        if (err) {
          callback(500, {
            "error": "could not read cart"
          });
        } else {
          callback(200, {
            "cart": cartdata
          });
        }
      });
    } else {
      callback(400, {
        "error": "Invalid Token"
      });
    }
  });
}

// Cart - Patch - adds an item to an existing cart
// Required data: token, menu-item
// Optional data: remark
_cart.patch = (data, callback) => {
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  let item = typeof (data.payload.item) == 'string' ? data.payload.item : false;
  let remark = typeof (data.payload.remark) == 'string' ? data.payload.remark : "no remarks";
  // Verify that the given token is valid for the email address
  _tokens.verifyToken(token, userEmail => {
    if (userEmail) {
      //check if this token already has an active cart
      _data.read('cart', userEmail, (err, cartdata) => {
        //only continue if it's an active cart
        if (!err) {
          //try to read the item from the menu
          _data.read('menu', item, (err, menudata) => {
            if (err) { //it does not exist
              callback(405, {
                "error": "item does not exist in menu"
              });
            } else { //it exists, continue
              //check if the item is available
              if (menudata.available) {
                let newitem = {};
                newitem.name = item;
                newitem.remark = remark;
                newitem.price = menudata.price;
                cartdata.items.push(newitem);
                cartdata.total += menudata.price;
                cartdata.waitTime += menudata.prepareTime;
                _data.update('cart', userEmail, cartdata, err => { //add to the cart with email as identifier
                  if (err) {
                    callback(500, {
                      "error": "could not create cart"
                    });
                  } else {
                    callback(200, cartdata);
                  }
                });
              } else {
                callback(405, {
                  "error": "item is not available in menu"
                });
              }
            }
          });
        } else { //if an active cart, callback an error and the actual cart
          callback(405, {
            "error": "No cart existing, use POST instead"
          });
        }
      });
    } else {
      callback(400, {
        "error": "Invalid Token"
      });
    }
  });
}

// Cart - Delete
// Required data: token
// Optional data: none
_cart.delete = (data, callback) => {
  // Check that token is valid
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  _tokens.verifyToken(token, userEmail => {
    if (userEmail) {
      // Lookup the token
      _data.read('cart', userEmail, (err, tokenData) => {
        if (!err && tokenData) {
          // Delete the cart
          _data.delete('cart', userEmail, err => {
            if (!err) {
              callback(200, { "Message": "Cart succesffully deleted" });
            } else {
              callback(500, {
                'Error': 'Could not delete the specified cart'
              });
            }
          });
        } else {
          callback(400, {
            'Error': 'Could not find the specified cart.'
          });
        }
      });
    } else {
      callback(400, {
        "error": "Invalid Token"
      });
    }
  });
}

export default _cart;