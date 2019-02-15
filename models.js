var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = function(wagner) {
  mongoose.connect('mongodb://localhost:27017/hanger');

  wagner.factory('db', function() {
    return mongoose;
  });

  var Category =
    mongoose.model('Category', require('./category'), 'categories');
  var User =
    mongoose.model('User', require('./user'), 'users');
  var Order =
    mongoose.model('Order', require('./order'), 'orders');

  var models = {
    Category: Category,
    User: User,
    Order: Order
  };

  // To ensure DRY-ness, register factories in a loop
  _.each(models, function(value, key) {
    wagner.factory(key, function() {
      return value;
    });
  });

  wagner.factory('Product', require('./product'));

  return models;
};
