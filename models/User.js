const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
  name: { type: String, required: [true, "Name required"] },
  username: { type: String, required: [true, "Name required"], unique: true, lowercase: true },
  pwd_hash: {
    type: String,
    required: [true, "No hash received for password"],
  },
});

module.exports = mongoose.model("User", userSchema);
