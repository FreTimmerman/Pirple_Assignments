import _data from '../data.js';
import config from '../config.js';
import { hash, createRandomString } from '../helpers.js'


const _tokens = []
// Tokens - POST
// Required data: email, password
// Optional data: none
_tokens.post = (data, callback) => {
  //console.log(data.payload)
  let email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    // Lookup the user who matches that email address
    _data.read('users', email, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        let hashedPassword = hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          let tokenId = createRandomString(config.tokenlength);
          let expires = Date.now() + 1000 * 60 * 60;
          let tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, err => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {
                'Error': 'Could not create the new token'
              });
            }
          });
        } else {
          callback(400, {
            'Error': 'Password did not match the specified user\'s stored password'
          });
        }
      } else {
        callback(400, {
          'Error': 'Could not find the specified user.'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field(s).'
    })
  }
};

// Tokens - GET
// Required data: id
// Optional data: none
_tokens.get = (data, callback) => {

  // Check that id is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == config.tokenlength ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { "error": "token not found" });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field, or field invalid'
    })
  }
};

// Tokens - PUT
// Required data: id, extend
// Optional data: none
_tokens.put = (data, callback) => {
  let id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == config.tokenlength ? data.payload.id.trim() : false;
  let extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    // Lookup the existing token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens', id, tokenData, err => {
            if (!err) {
              callback(200, tokenData);
            } else {
              callback(500, {
                'Error': 'Could not update the token\'s expiration.'
              });
            }
          });
        } else {
          callback(400, {
            "Error": "The token has already expired, and cannot be extended."
          });
        }
      } else {
        callback(400, {
          'Error': 'Specified user does not exist.'
        });
      }
    });
  } else {
    callback(400, {
      "Error": "Missing required field(s) or field(s) are invalid."
    });
  }
};


// Tokens - DELETE
// Required data: id
// Optional data: none
_tokens.delete = (data, callback) => {
  // Check that id is valid
  let id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == config.tokenlength ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Delete the token
        _data.delete('tokens', id, err => {
          if (!err) {
            callback(200, { "message": "token deleted" });
          } else {
            callback(500, {
              'Error': 'Could not delete the specified token'
            });
          }
        });
      } else {
        callback(400, {
          'Error': 'Could not find the specified token.'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    })
  }
};

// Verify if a given token id is currently valid for a given user
_tokens.verifyTokenEmail = (id, email, callback) => {
  // Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


// Verify if a given token id is currently valid for any user, and if so, return its email address
_tokens.verifyToken = (id, callback) => {
  // Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token has not expired
      if (tokenData.expires > Date.now()) {
        callback(tokenData.email);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


export default _tokens;