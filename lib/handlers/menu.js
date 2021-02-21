import _data from '../data.js';
import _tokens from './tokens.js';

const _menu = {}


// Menu - get
// Required header: token
// Optional data: none
_menu.get = (data, callback) => {
  // Get token from headers
  const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  // Verify that the given token is valid for the email address
  _tokens.verifyToken(token, isTokenValid => {
    if (isTokenValid) {
      // Lookup the menu (all files in the menu folder)
      _data.list('menu', (err, menudata) => {
        if (!err) {
          //create menu object to return
          let menuobj = {};
          //for each menu item look up the data
          let promMenu = menudata.map(item => {
            //create promise to resolve when done
            return new Promise((resolve, reject) => {
              //read the item's data from file
              _data.read('menu', item, (err, itemdata) => {
                if (!err) {
                  //only add if the item is available
                  if (itemdata.available) {
                    //delete the "available" key before returning
                    delete itemdata.available;
                    //add the item's data to the menu object with the name as key
                    menuobj[item] = itemdata;
                  }
                  resolve();
                } else {
                  reject();
                }
              });
            });
          });

          //if all files are read, return the user the menu object
          Promise.all(promMenu)
            .then(() => callback(200, menuobj))
            .catch(() => callback(500, {
              "error": "could not load the menu"
            })
            );

        } else {
          callback(500, {
            "error": "could not load the menu"
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

export const getItemPrice = (str, callback) => {
  const item = typeof (str) == 'string' ? str : false;

  if (item) {
    _data.read('menu', item, (err, itemdata) => {

      if (!err) {
        //return the item's price
        //console.log(itemdata.price)
        callback(itemdata.price);
      } else {
        //return false
        //console.log(err)
        callback(false);
      }
    });
  }

}

export default _menu;