const grpc = require("@grpc/grpc-js");
const checkAuth = require("../middleware/checkAuth");
const Folder = require("../models/Folder");

exports.CreateFolder = async (call, callback) => {
  try {
    // Check authentication
    const user_id = checkAuth(call.metadata);

    // Check if folder name is given
    if (call.request.name === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Folder name required" });

    // Check if folder doesn't start with a symbol
    const regex = new RegExp("^[a-zA-Z0-9]");
    if (!regex.test(call.request.name))
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Folder name cannot start with a symbol" });

    const folderInfo = { user_id: user_id, name: call.request.name };

    // Check if folder exists
    const folderExists = await Folder.exists(folderInfo);
    if (folderExists) return callback({ code: grpc.status.ALREADY_EXISTS, details: "Folder already exists" });

    // Create folder
    const folder = new Folder(folderInfo);
    const savedFolder = await folder.save();

    callback(null, {
      folder: {
        _id: savedFolder._id,
        name: savedFolder.name,
        created_at: savedFolder.created_at,
      },
    });
  } catch (error) {
    console.log(error);
    if (error === "Invalid token/Session expired")
      callback({
        code: grpc.status.UNAUTHENTICATED,
        details: error,
      });
    callback({
      code: grpc.status.UNKNOWN,
      details: error,
    });
  }
};
