const grpc = require("@grpc/grpc-js");
const checkAuth = require("../middleware/checkAuth");
const File = require("../models/File");
const Folder = require("../models/Folder");

exports.CreateFile = async (call, callback) => {
  try {
    // Check authentication
    const user_id = checkAuth(call.metadata);

    // Check if file details are given
    if (call.request.name === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "File name required" });
    if (call.request.content === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "File content required" });

    const fileInfo = {
      user_id: user_id,
      name: call.request.name,
      content: call.request.content,
    };

    // If folder_id is not given, save to root folder
    if (call.request.folder_id === "" || call.request.folder_id === undefined) {
      //Create root folder if doesn't exist
      const rootFolderExists = await Folder.exists({ user_id: user_id, name: "/" });
      if (!rootFolderExists) {
        const folder = new Folder({ user_id: user_id, name: "/" });
        const savedFolder = await folder.save();
        fileInfo.folder_id = savedFolder._id;
      } else fileInfo.folder_id = rootFolderExists._id;
    }

    // Check if folder exists only when folder_id is mentioned
    if (!(call.request.folder_id === "" || call.request.folder_id === undefined)) {
      const folderExists = await Folder.exists({ user_id: user_id, _id: fileInfo.folder_id });
      if (!folderExists) return callback({ code: grpc.status.NOT_FOUND, details: "Folder doesn't exist" });
      fileInfo.folder_id = call.request.folder_id;
    }

    // Check if file exists
    const fileExists = await File.exists({
      folder_id: fileInfo.folder_id,
      user_id: fileInfo.user_id,
      name: fileInfo.name,
    });
    if (fileExists) return callback({ code: grpc.status.ALREADY_EXISTS, details: "File already exists" });

    // Create file
    const file = new File(fileInfo);
    const savedFile = await file.save();

    callback(null, {
      file: {
        _id: savedFile._id,
        name: savedFile.name,
        created_at: savedFile.created_at,
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

exports.GetFileContent = async (call, callback) => {
  try {
    // Check authentication
    const user_id = checkAuth(call.metadata);

    // Check if file ID is given
    if (call.request.file_id === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "File ID required" });

    // Get file content
    const fileContent = await File.findById(call.request.file_id).select("content").lean();

    if (!fileContent) return callback({ code: grpc.status.NOT_FOUND, details: "File doesn't exist" });

    callback(null, { content: fileContent.content });
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
