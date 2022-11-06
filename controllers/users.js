const grpc = require("@grpc/grpc-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

exports.Register = async (call, callback) => {
  try {
    if (call.request.name === "") return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Name required" });
    if (call.request.username === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Username required" });
    if (call.request.pwd === "") return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Password required" });

    // Hash password
    const passwordHash = await bcrypt.hash(call.request.pwd, 10);

    const user = new User({
      name: call.request.name,
      username: call.request.username,
      pwd_hash: passwordHash,
    });

    //Save user
    await user.save();

    callback(null, { message: "User registered successfully" });
  } catch (error) {
    console.log(error);
    if (error.name === "MongoServerError" && error.code === 11000)
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        details: "Username already exists",
      });
    callback({
      code: grpc.status.UNKNOWN,
      details: error,
    });
  }
};

exports.Login = async (call, callback) => {
  try {
    if (call.request.username === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Username required" });
    if (call.request.pwd === "") return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Password required" });

    // Find username
    const userFound = await User.findOne({ username: call.request.username }).lean();
    if (!userFound) return callback({ code: grpc.status.UNAUTHENTICATED, details: "Invalid username/password" });

    // Check password
    const match = await bcrypt.compare(call.request.pwd, userFound.pwd_hash);

    // If correct, send token
    if (match) {
      const tokenData = { user_id: userFound._id };
      const token = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
        expiresIn: parseInt(process.env.TOKEN_EXPIRY, 10),
      });

      callback(null, { token: token });
    } else callback({ code: grpc.status.UNAUTHENTICATED, details: "Invalid username/password" });
  } catch (error) {
    console.log(error);
    callback({
      code: grpc.status.UNKNOWN,
      details: error,
    });
  }
};
