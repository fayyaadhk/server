var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var SchemaOrder = require('./order');

var UserSchema = new mongoose.Schema({
  profile: {
    name: {
      type: String,
      required: true
    },
    surname: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true
    },
    picture: {
      type: String,
      required: false,
      match: /^http:\/\//i
    }
  },
  data: {
    oauth: { type: String, required: false },
    cart: [{
      product: {
        type: mongoose.Schema.Types.ObjectId
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1
      }
    }],
    orders:[SchemaOrder]
  }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = UserSchema;
//module.exports.set('toObject', { virtuals: true });
//module.exports.set('toJSON', { virtuals: true });
