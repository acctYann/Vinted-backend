const mongoose = require("mongoose");

const User = mongoose.model("User", {
  account: {
    username: {
      required: true,
      type: String,
    },
    phone: String,
    avatar: Object,
  },
  email: {
    unique: true,
    type: String,
  },
  salt: String,
  hash: String,
  token: String,
});

module.exports = User;
