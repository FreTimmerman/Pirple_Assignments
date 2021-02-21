import _tokens from './tokens.js';
import _data from '../data.js';
import { hash, isValidEmail } from '../helpers.js';

const _users = {};

// Users - POST | Create a new user
// Required data (as payload): firstName, lastName, email, password, address, zip
// Optional data: none
_users.post = (data, callback) => {
  // Check that all required fields are filled out
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let email = typeof (data.payload.email) == 'string' && isValidEmail(data.payload.email) && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  let zip = typeof (data.payload.zip) == 'string' && data.payload.zip.trim().length > 0 ? data.payload.zip.trim() : false;

  if (firstName && lastName && email && password && address && zip) {
    // Make sure the user doesn't already exist
    _data.read('users', email, (err, data) => {
      if (err) {
        // Hash the password
        let hashedPassword = hash(password);

        // Create the user object
        if (hashedPassword) {
          const userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'hashedPassword': hashedPassword,
            'email': email,
            'address': address,
            'zip': zip
          };
          const userObjectReturned = {
            'firstName': firstName,
            'lastName': lastName,
            'email': email,
            'address': address,
            'zip': zip
          };
          // Store the user
          _data.create('users', email, userObject, err => {
            if (!err) {
              callback(200, userObjectReturned);
            } else {
              callback(500, {
                'Error': 'Could not create the new user'
              });
            }
          });
        } else {
          callback(500, {
            'Error': 'Could not hash the user\'s password.'
          });
        }
      } else {
        // User alread exists
        callback(400, {
          'Error': 'A user with that email address already exists'
        });
      }
    });

  } else {
    const fields = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      address: address,
      zip: zip
    }
    callback(400, {
      'Error': 'Missing required fields: ' + Object.keys(fields).map(key => !fields[key] ? key : null).filter(el => el !== null).join(", ")
    });
  }

};

// Users - GET | find a user
// Required data (as querystring): email
// Required headers: token
// Optional data: none
_users.get = (data, callback) => {
  // Check that email address is valid
  let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get token from headers
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email address
    _tokens.verifyTokenEmail(token, email, isTokenValid => {
      if (isTokenValid) {
        // Lookup the user
        _data.read('users', email, (err, data) => {
          if (!err && data) {
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, { "error": "user not found" });
          }
        });
      } else {
        callback(403, {
          "Error": "Missing required token in header, or token is invalid."
        })
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    })
  }
};

// Users - PUT | update a user
// Required data (as payload): email
// Required headers: token
// Optional data: firstName, lastName, password (at least one must be specified)
_users.put = (data, callback) => {
  // Check for required field
  let email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

  // Check for optional fields
  let firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  let lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  let password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  let zip = typeof (data.payload.zip) == 'string' && data.payload.zip.trim().length > 0 ? data.payload.zip.trim() : false;

  // Error if email is invalid
  if (email) {
    // Error if nothing is sent to update
    if (firstName || lastName || password || zip) {

      // Get token from headers
      let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the email address
      _tokens.verifyTokenEmail(token, email, isTokenValid => {
        if (isTokenValid) {

          // Lookup the user
          _data.read('users', email, (err, userData) => {
            if (!err && userData) {
              // Update the fields if necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = hash(password);
              }
              if (zip) {
                userData.zip = zip;
              }
              // make new object which will be returned, without the hashed password
              const { hashedPassword, ...userDataReturned } = userData;
              // Store the new updates
              _data.update('users', email, userData, err => {
                if (!err) {
                  callback(200, userDataReturned);
                } else {
                  callback(500, {
                    'Error': 'Could not update the user.'
                  });
                }
              });
            } else {
              callback(400, {
                'Error': 'Specified user does not exist.'
              });
            }
          });
        } else {
          callback(403, {
            "Error": "Missing required token in header, or token is invalid."
          });
        }
      });
    } else {
      callback(400, {
        'Error': 'Missing fields to update.'
      });
    }
  } else {
    callback(400, {
      'Error': 'Missing required field.'
    });
  }

};

// Users - DELETE | remove a user
// Required data (as querystring): email
// Required headers: token
// @TODO Cleanup (delete) any other data files associated with the user
_users.delete = (data, callback) => {
  // Check that email address is valid
  let email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get token from headers
    let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email address
    _tokens.verifyTokenEmail(token, email, isTokenValid => {
      if (isTokenValid) {
        // Lookup the user
        _data.read('users', email, (err, data) => {
          if (!err && data) {
            _data.delete('users', email, err => {
              if (!err) {
                callback(200, { "Message": "User deleted successfully" });
              } else {
                callback(500, {
                  'Error': 'Could not delete the specified user'
                });
              }
            });
          } else {
            callback(400, {
              'Error': 'Could not find the specified user.'
            });
          }
        });
      } else {
        callback(403, {
          "Error": "Missing required token in header, or token is invalid."
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required field'
    })
  }
};

export default _users;