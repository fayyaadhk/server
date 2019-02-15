var bodyparser = require('body-parser');
var express = require('express');
var status = require('http-status');
var _ = require('underscore');
var mongoose = require('mongoose');

var email   = require("emailjs/email");
  var server  = email.server.connect({
   user:  "Hangerstores@gmail.com", 
   password:"Hanger123", 
   host:  "smtp.gmail.com", 
   ssl:   true
});

module.exports = function(wagner) {
  var api = express.Router();

  api.use(bodyparser.json());

  /* Category API */
  api.get('/category/id/:id', wagner.invoke(function(Category) {
    return function(req, res) {
      Category.findOne({ _id: req.params.id }, function(error, category) {
        if (error) {
          return res.
            status(status.INTERNAL_SERVER_ERROR).
            json({ error: error.toString() });
        }
        if (!category) {
          return res.
            status(status.NOT_FOUND).
            json({ error: 'Not found' });
        }
        res.json({ category: category });
      });
    };
  }));

  api.get('/category/parent/:id', wagner.invoke(function(Category) {
    return function(req, res) {
      Category.
        find({ parent: req.params.id }).
        sort({ _id: 1 }).
        exec(function(error, categories) {
          if (error) {
            return res.
              status(status.INTERNAL_SERVER_ERROR).
              json({ error: error.toString() });
          }
          res.json({ categories: categories });
        });
    };
  }));

  /* Product API */
  api.get('/product/id/:id', wagner.invoke(function(Product) {
    return function(req, res) {
      Product.findOne({ _id: req.params.id },
        handleOne.bind(null, 'product', res));
    };
  }));

  api.get('/product/category/:id', wagner.invoke(function(Product) {
    return function(req, res) {
      var sort = { name: 1 };
      if (req.query.price === "1") {
        sort = { 'internal.approximatePriceUSD': 1 };
      } else if (req.query.price === "-1") {
        sort = { 'internal.approximatePriceUSD': -1 };
      }

      Product.
        find({ 'category.ancestors': req.params.id }).
        sort(sort).
        exec(handleMany.bind(null, 'products', res));
    };
  }));

  /* User API */
  api.put('/me/cart', wagner.invoke(function(User) {
    return function(req, res) {
      try {
        var cart = req.body.data.cart;
      } catch(e) {
        return res.
          status(status.BAD_REQUEST).
          json({ error: 'No cart specified!' });
      }

      req.user.data.cart = cart;
      console.log(req.user.data.orders)
      req.user.save(function(error, user) {
        if (error) {
          console.log(error);
          return res.
            status(status.INTERNAL_SERVER_ERROR).
            json({ error: error.toString() });
        }
        return res.json({ user: user });
      });
    };
  }));

  api.post('/testlogin', function(req, res){
    console.log(req.body);
    res.json({name:"Mbongeni", surname:"Maiketso"});
  });

  api.get('/me', function(req, res) {
    console.log(req.user);
    if (!req.user) {
      return res.
        status(status.UNAUTHORIZED).
        json({ error: 'Not logged in' });
    }

    req.user.populate({ path: 'data.cart.product', model: 'Product' }, handleOne.bind(null, 'user', res));
  });

  /* Stripe Checkout API */
  api.post('/checkout', wagner.invoke(function(User, Stripe, Order) {
    return function(req, res) {
      if (!req.user) {
        return res.
          status(status.UNAUTHORIZED).
          json({ error: 'Not logged in' });
      }
      // Populate the products in the user's cart
      req.user.populate({ path: 'data.cart.product', model: 'Product' }, function(error, user) {

        // Sum up the total price in USD
        var totalCostUSD = 0;
        _.each(user.data.cart, function(item) {
          totalCostUSD += item.product.internal.approximatePriceUSD *
            item.quantity;
        });
        totalCostUSD = 100;
        // And create a charge in Stripe corresponding to the price
        Stripe.charges.create(
          {
            // Stripe wants price in cents, so multiply by 100 and round up
            amount: Math.ceil(totalCostUSD * 100),
            currency: 'usd',
            source: req.body.stripeToken,
            description: 'Example charge'
          },
          function(err, charge) {
            if (err && err.type === 'StripeCardError') {
              return res.
                status(status.BAD_REQUEST).
                json({ error: err.toString() });
            }
            if (err) {
              console.log(err);
              return res.
                status(status.INTERNAL_SERVER_ERROR).
                json({ error: err.toString() });
            }


            //place the users user in the orders collection

            

            if(req.user.data.cart.length > 0){
                var userOrder = new Order ({
                orderNumber: 'testnumber',
                //userID :  user._id,
                /*deliveryDetail.name: user.profile.name,
                deliveryDetail[address].addr1: req.body.addr1,
                deliveryDetail.address.addr2: req.body.addr2,
                deliveryDetail.address.addr3: req.body.addr3,
                deliveryDetail.address.addr4: req.body.addr4,*/
                cartTotal : totalCostUSD,
                subtotal: totalCostUSD,
                orderTotal: totalCostUSD,
                products: req.user.data.cart
              });

              var message = {
                text:  "Thanks for shopping @ Hanger", 
                from:  "Hanger <Hangerstores@gmail.com>", 
                to:    req.user.profile.name+" <"+req.user.username+">",
                subject: "Order Recieved"
              };
              // send the message and get a callback with an error or details of the message that was sent
              server.send(message, function(err, message) {
                console.log(err || message); 
                //res.json(myuser);
              });  
              console.log('creating customer order');
              req.user.data.orders.push(userOrder);
            }

            req.user.data.cart = [];
            req.user.save(function() {
              // Ignore any errors - if we failed to empty the user's
              // cart, that's not necessarily a failure

              // If successful, return the charge id
              return res.json({ id: charge.id });
            });
          });
      });
    };
  }));

  /* text search API */
  api.get('/product/text/:query', wagner.invoke(function(Product) {
    return function(req, res) {
      Product.
        find(
          { $text : { $search : req.params.query } },
          { score : { $meta: 'textScore' } }).
        sort({ score: { $meta : 'textScore' } }).
        limit(10).
        exec(handleMany.bind(null, 'products', res));
    };
  }));

  return api;
};

function handleOne(property, res, error, result) {
  if (error) {
    return res.
      status(status.INTERNAL_SERVER_ERROR).
      json({ error: error.toString() });
  }
  if (!result) {
    return res.
      status(status.NOT_FOUND).
      json({ error: 'Not found' });
  }

  var json = {};
  json[property] = result;
  res.json(json);
}

function handleMany(property, res, error, result) {
  if (error) {
    return res.
      status(status.INTERNAL_SERVER_ERROR).
      json({ error: error.toString() });
  }

  var json = {};
  json[property] = result;
  res.json(json);
}
