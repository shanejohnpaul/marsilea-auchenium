const grpc = require("@grpc/grpc-js");
const checkAuth = require("../middleware/checkAuth");
const Folder = require("../models/Folder");
const File = require("../models/File");

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
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        details: error,
      });
    callback({
      code: grpc.status.UNKNOWN,
      details: error,
    });
  }
};

exports.GetFolderContent = async (call, callback) => {
  try {
    // Check authentication
    const user_id = checkAuth(call.metadata);

    // Return root folder contents if folder_id in not given
    if (call.request.folder_id === "" || call.request.folder_id === undefined) {
      // Get all folders
      const allFolders = await Folder.find({ user_id: user_id }).select("-user_id -__v").lean();

      // Check if root folder exists
      const rootFolderExists = await Folder.exists({ user_id: user_id, name: "/" });
      if (!rootFolderExists) return callback(null, { files: [], folders: allFolders });
      else {
        const rootFilesFound = await File.find({ user_id: user_id, folder_id: rootFolderExists._id })
          .select("-user_id -folder_id -content -__v")
          .lean();
        return callback(null, { files: rootFilesFound, folders: allFolders });
      }
    }

    // Check if folder exists
    const folderExists = await Folder.findOne({ user_id: user_id, _id: call.request.folder_id });
    if (!folderExists) return callback({ code: grpc.status.NOT_FOUND, details: "Folder doesn't exists" });

    // Get files in folder
    const filesFound = await File.find({ user_id: user_id, folder_id: folderExists._id })
      .select("-user_id -folder_id -content -__v")
      .lean();

    // If root folder, send all folders too
    if (folderExists.name === "/") {
      const allFolders = await Folder.find({ user_id: user_id }).select("-user_id -__v").lean();
      return callback(null, { files: filesFound, folders: allFolders });
    }

    callback(null, { files: filesFound, folders: [] });
  } catch (error) {
    console.log(error);
    if (error === "Invalid token/Session expired")
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        details: error,
      });
    if (error.name === "CastError")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Folder ID invalid" });
    callback({
      code: grpc.status.UNKNOWN,
      details: error,
    });
  }
};
