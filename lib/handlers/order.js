import _data from '../data.js';
import _tokens from './tokens.js';
//import { request } from 'https';
import * as https from 'https';
import config from '../config.js';
import _menu from './menu.js';
import { createRandomString } from '../helpers.js';
import querystring from 'querystring';

const _order = {};


// Orders - post
// Required data (as payload): confirm (boolean)
// Required header: token
// Optional data (as payload): remark (string)
_order.post = (data, callback) => {
  let token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
  let confirm = typeof (data.payload.confirm) == 'boolean' ? data.payload.confirm : false;
  let remark = typeof (data.payload.remark) == 'string' ? data.payload.remark : "no remarks";
  if (token && confirm) {
    // Verify that the given token is valid for the email address
    _tokens.verifyToken(token, userEmail => {
      if (userEmail) {
        //check if this token already has an active cart
        _data.read('cart', userEmail, (err, cartdata) => {
          if (!err) { //if no error (active cart is found), continue
            //calculate total price of all the items
            const amount = cartdata.total * 100; //amount in eurocents

            //create datastring and postOptions for sending to Stripe, with testdata
            const stripeDataString = `amount=${amount}&currency=eur&payment_method=pm_card_visa&confirm=true`;
            const stripePostOptions = {
              port: '443',
              method: 'POST',
              auth: config.stripeSecretKey + ':'
            };

            // Set up the request
            const stripePostReq = https.request('https://api.stripe.com/v1/payment_intents', stripePostOptions, function (res) {
              res.setEncoding('utf8');
              let data = "";
              res.on('data', function (chunk) {
                data += chunk;
                //console.log('Response: ' + chunk);
              });
              res.on('end', () => {
                // successfully created and confirmed the paymentIntent
                if (res.statusCode == 200) {
                  // change the cart data to an order
                  const orderData = cartdata;
                  orderData.remark = remark;
                  // add 10 minutes of estimated delivery time to the total prepare time
                  // this could be dynamic based on delivery address, or weather, or waiting customers, or ...
                  orderData.waitTime += 10;
                  // to give an unique id, we combine the user's email with a random string
                  const orderID = orderData.user + "_" + createRandomString(10);
                  _data.create("orders", orderID, orderData, (err) => {
                    if (!err) {
                      // successfully created order file
                      _data.delete("cart", userEmail, (err) => {
                        if (!err) {
                          //successfully deleted cart file
                          // === send email confirmation ===

                          // create receipt
                          // (for simplicity, i'm just going to stringify the JSON for now, 
                          //  but i should style this data, this is TODO)
                          const receipt = JSON.stringify(orderData);
                          //create datastring and postOptions for sending to Stripe, with testdata
                          //const mailgunDataString = 'amount=' + amount + '&currency=eur&payment_method=pm_card_visa&confirm=true';
                          const mailgunPostData = querystring.stringify({
                            'from': `Mailgun Sandbox <postmaster@${config.mailgunDomain}>`,
                            'to': `<${orderData.user}>`,//'Fre Timmerman <fre.timmerman@gmail.com>',
                            'subject': "order receipt",
                            'text': "Your order was successfully received by us.\nWe'll start making your pizzas now, and send them to your address.\nHere is your receipt:\n" + receipt
                          });
                          const mailgunPostOptions = {
                            port: '443',
                            method: 'POST',
                            auth: `api:${config.mailgunSecretKey}`,
                            headers: {
                              'Content-Type': 'application/x-www-form-urlencoded',
                              'Content-Length': Buffer.byteLength(mailgunPostData)
                            }
                          };

                          // Set up the request
                          const mailgunPostReq = https.request(`https://api.mailgun.net/v3/${config.mailgunDomain}/messages`, mailgunPostOptions, function (res) {
                            //console.log(`STATUS: ${res.statusCode}`);
                            //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                            res.setEncoding('utf8');
                            let data = ""
                            res.on('data', (chunk) => {
                              data += chunk;
                              //console.log(`BODY: ${chunk}`);
                            });
                            res.on('end', () => {
                              //console.log(data);
                              if (res.statusCode === 200) {
                                callback(200, {
                                  "Message": "Order successfully created and paid for. Check your (junk) mailbox for the receipt", "WaitTime": orderData.waitTime
                                });
                              } else {
                                callback(500, {
                                  "Error": "Something went wrong sending the confirmation mail (receipt)"
                                });
                              }

                            });
                          });

                          // Write data to request body
                          mailgunPostReq.write(mailgunPostData);
                          mailgunPostReq.end();

                        } else {
                          callback(500, { "Error": "something went wrong converting deleting the cart, but payment succeeded." })
                        }
                      })
                    } else {
                      callback(500, { "Error": "something went wrong creating the order, but payment succeeded." })
                    }
                  })
                } else {
                  callback(500, { "Error": "something went wrong processing the payment" })
                }
              });
            });

            // post the stripe data
            stripePostReq.write(stripeDataString);
            stripePostReq.end();



          } else { //if an active cart, callback an error and the actual cart
            callback(400, {
              "error": "No existing cart found, create a cart first"
            });
          }
        });
      } else {
        callback(400, {
          "error": "Invalid Token"
        });
      }
    });
  } else {
    callback(400, {
      "Error": "Missing required field(s) or field(s) are invalid."
    });
  }
}

export default _order;