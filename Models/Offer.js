const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, maxlength: 50 },
  product_description: { type: String, maxlength: 500 },
  product_price: { type: Number, max: 100000 },
  product_details: Array,
  owner: {
    type: mongoose.Schema.Types.ObjectId, // ObjectId = c'est l'id de user, qui sera dans l'annonce offer
    ref: "User",
  },
  product_image: { type: mongoose.Schema.Types.Mixed, default: {} }, // Mixed : un SchemaType "tout est permis"
  product_date: { type: Date, default: Date.now },
});

module.exports = Offer;
