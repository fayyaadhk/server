var mongoose = require('mongoose');

var orderSchema = {
  	orderNumber: {
  	type: String,
  	required:false, unique: false
  },
  orderDate:{type: Date, required: false, default: Date.now()},
  deliveryDate: {type: Date, required:true, default: Date.now()+5},
  //userID:{type: mongoose.Schema.Types.ObjectId, required:false, unique: false},
  deliveryDetail :{
  	name: String,
  	address:{
  		addr1: String,
  		addr2: String,
  		addr3: String,
  		addr4: String,
  		addr1: String
  	},
  	cartTotal: {type:Number, required: false},
  	discount: {type: Number, required: true, default: 0},
  	subtotal: {type: Number, required:false},
   	deliveryFee: {type: Number, required: true, default: 30},
  	orderTotal: {type: Number, required: false}
  },
  products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1
      }
    }],
  status: {
    type: String,
    enum: ['Processing','Dispatched', 'Delivered'],
    default: 'Processing'
  }
};

module.exports = new mongoose.Schema(orderSchema);
module.exports.orderSchema = orderSchema;
