# Homework Assignment 2 of the Node.js master class <!-- omit in toc -->

API for a pizza-delivery

## Table of Contents <!-- omit in toc -->

- [Setup](#setup)
- [Frontend USAGE tutorial](#frontend-usage-tutorial)
- [API USAGE tutorial](#api-usage-tutorial)
  - [Create a new user (API)](#create-a-new-user-api)
  - [Login (API)](#login-api)
  - [Read the menu (API)](#read-the-menu-api)
  - [Add items to cart (API)](#add-items-to-cart-api)
  - [Create an order (API)](#create-an-order-api)
- [Full API documentation](#full-api-documentation)
  - [**User** actions](#user-actions)
    - [GET /users](#get-users)
    - [POST /users](#post-users)
    - [PUT /users](#put-users)
    - [DELETE /users](#delete-users)
  - [**Token** actions](#token-actions)
    - [GET /tokens](#get-tokens)
    - [POST /tokens](#post-tokens)
    - [PUT /tokens](#put-tokens)
    - [DELETE /tokens](#delete-tokens)
  - [**Menu** actions](#menu-actions)
    - [GET /menu](#get-menu)
  - [**Cart** actions](#cart-actions)
    - [GET /cart](#get-cart)
    - [POST /cart](#post-cart)
    - [PATCH /cart](#patch-cart)
    - [DELETE /cart](#delete-cart)
  - [**Order** actions](#order-actions)
    - [POST /order](#post-order)
- [Original Assignment](#original-assignment)

## Setup

- rename `config_example.js` to `config.js` and fill in all the necessary variables.

  **IMPORTANT!** fill in with your own API keys:
  - `stripeSecretKey`
  - `mailgunSecretKey`
  - `mailgunDomain`

  **otherwise this server will not work!**

- Start the app by running `node index.js` in the command line.

  (that's right, you don't need to install any dependencies for this API)

## Frontend USAGE tutorial

- go to `http://localhost:3000/`
- create a new user (or log in if you already have)  and fill in your account detail
- click `get started` (or `login`)
  
  you will be logged in and you will see the menu

- on the items you want to buy, click `add to cart` (you can enter an optional remark, for example: no cheese)
- click in the top menu on `cart` to see your current cart (tip: this cart gets saved even when you log out)
- you can remove items from your cart, or when you're finished, you can click `order these items`
- you will see the total amount on the order page, here you can also optionally add a remark (for example: knock hard, doorbell is broken)
- enter your card data (for mock data, you can use `4242 4242 4242 4242` as card number, and any date in the future, and any cvc, and any postcode)
- if you press `confirm payment and create order` you will be charged on the provided card, and you will receive an email with the receipt.
- you will be sent to a confirmation page, where you can see the estimated delivery time.

## API USAGE tutorial

### Create a new user (API)

- send a `POST` request to `http://localhost:3000/users` with JSON payload

  ```JSON
  {
    "firstName": "test",
    "lastName": "lastname",
    "email": "test@gmail.com",
    "password": "123456",
    "address": "teststreet 123",
    "zip": "4567"
  }
  ```

- you will receive a response with body

  ```JSON
  {
    "firstName": "test",
    "lastName": "lastname",
    "email": "test@gmail.com",
    "address": "teststreet 123",
    "zip": "4567"
  }
  ```

### Login (API)

now you can use this user's email and password to login

- send a `POST` request to `http://localhost:3000/tokens` with JSON payload

  ```JSON
  {
    "email": "example@domain.com",
    "password": "123456"
  }
  ```

- you will receive a JSON token

  ```JSON
  {
    "email": "example@domain.com",
    "id": "0fyDGiQYxSjpFowpSAj9A2UUAgZbZpkDBKN",
    "expires": 1613558590079
  }
  ```

- you can use this token id for authenticating your user for these next steps
  
### Read the menu (API)

get the menu to choose items to put in the cart

- send `GET` request to `http://localhost:3000/menu` with headers

  ```JSON
  {
    "token": "0fyDGiQYxSjpFowpSAj9A2UUAgZbZpkDBKN"
  }
  ```

  (You received this token in the "id" from the previous step)

  You will receive an array of the current available items on the menu:

  ```JSON
  {
    "Funghi": {
      "name": "Funghi",
      "prepareTime": 20,
      "price": 13,
      "ingredients": [
        "tomato sauce",
        "cheese",
        "mushrooms"
      ]
    },
    "Margherita": {
      "name": "Margherita",
      "prepareTime": 15,
      "price": 10,
      "ingredients": [
        "tomato sauce",
        "cheese"
      ]
    },
    "Hawaii": {
      "name": "Hawaii",
      "prepareTime": 20,
      "price": 12,
      "ingredients": [
        "tomato sauce",
        "cheese",
        "pineapple"
      ]
    }
  }
  ```

### Add items to cart (API)

- create a new cart by sending a `POST` request to `http://localhost:3000/cart` with header

  ```JSON
  {
    "token": "0fyDGiQYxSjpFowpSAj9A2UUAgZbZpkDBKN"
  }
  ```

  and the item name as payload, the remark is optional

  ``` JSON
  {
    "item": "Margherita",
    "remark": "extra cheese"
  }
  ```

- __OPTIONAL__:  you can add another item to your existing cart by sending a `PATCH` request to `http://localhost:3000/cart` with header

  ```JSON
  {
    "token": "0fyDGiQYxSjpFowpSAj9A2UUAgZbZpkDBKN"
  }
  ```

  and the `item` name as payload, the `remark` is optional

  ``` JSON
  {
    "item": "Funghi",
    "remark": "no cheese"
  }
  ```

### Create an order (API)

 converting your cart into an order

- send a `POST` request to `http://localhost:3000/order`, again with header

  ```JSON
  {
    "token": "0fyDGiQYxSjpFowpSAj9A2UUAgZbZpkDBKN"
  }
  ```

  and a boolean `confirm` as payload, the `remark` is optional

  ```JSON
  {
    "confirm": true,
    "remark": "you must knock on the door, because my doorbell is broken"
  }
  ```

  **REMARK:** Normally, at this point, you would also provide your payment information, to provide to Stripe for an actual payment, but we are using sandbox data, so we can skip this.

  You will receive a confirmation that your order is paid and how long it will take to arrive to your address

  ```JSON
  {
    "Message": "Order successfully created and paid for. Check your (junk) mailbox for the receipt",
    "WaitTime": 30
  }
  ```

  At this point, your existing cart will be removed, but we have saved your order information.

  **You will receive a receipt on the email address you entered while making the user.**

## Full API documentation

### **User** actions

#### GET /users

finds a user object

- Required data (as querystring):
  - email (string)
- Required headers:
  - token (string)

#### POST /users

Creates a new user

- Required data (as payload):
  - firstName (string)
  - lastName (string)
  - email (string)
  - password (string)
  - address (string)
  - zip (string)

#### PUT /users

updates a user

- Required data (as payload):
  - email (string)
- Required headers:
  - token (string)
- Optional data (as payload): (at least one must be specified)
  - firstName (string)
  - lastName (string)
  - password (string)
  
#### DELETE /users

removes a user completely

- Required data (as querystring):
  - email (string)
- Required headers:
  - token (string)

### **Token** actions

#### GET /tokens

- Required data (as querystring):
  - id (string)

#### POST /tokens

Logs in a user by creating a token

- Required data (as payload):
  - email (string)
  - password (string)

#### PUT /tokens

Used to extend the expiry time of an existing token

- Required data (as payload):
  - id (string)
  - extend (boolean)

#### DELETE /tokens

Logs a user out by deleting their token

- Required data (as querystring):
  - id (string)

### **Menu** actions

#### GET /menu

finds all menu items

- Required headers:
  - token (string)

### **Cart** actions

#### GET /cart

shows all items in your current cart

- Required headers:
  - token (string)

#### POST /cart

creates a new cart with 1 item in it

- Required headers:
  - token (string)
- Required data (as payload):
  - item (string): the name of the pizza
- Optional data (as payload):
  - remark (string): a remark for this particular pizza

#### PATCH /cart

adds a single item to the existing cart

- Required headers:
  - token (string)
- Required data (as payload):
  - item (string): the name of the pizza
- Optional data (as payload):
  - remark (string): a remark for this particular pizza

#### DELETE /cart

deletes the entire current cart

- Required headers:
  - token (string)

### **Order** actions

#### POST /order

converts existing cart to an order

- Required headers:
  - token (string)
- Required data (as payload):
  - confirm (boolean)
- Optional data (as payload):
  - remark (string): a remark for the entire order

## Original Assignment

**Details (Scenario):**

It is time to build a simple frontend for the Pizza-Delivery API you created in Homework Assignment #2. Please create a web app that allows customers to:

[x] Signup on the site

[x] View all the items available to order

[x] Fill up a shopping cart

[x] Place an order (with fake credit card credentials), and receive an email receipt

This is an open-ended assignment. You can take any direction you'd like to go with it, as long as your project includes the requirements. It can include anything else you wish as well.
