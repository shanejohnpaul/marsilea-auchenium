const jwt = require("jsonwebtoken");

//Check if token is valid and return user ID
module.exports = (metadata) => {
  try {
    if (!metadata.internalRepr.has("authorization")) throw "Invalid token/Session expired";
    const token = metadata.internalRepr.get("authorization")[0];
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    return decodedToken.user_id;
  } catch (error) {
    throw "Invalid token/Session expired";
  }
};
