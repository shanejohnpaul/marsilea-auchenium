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
      const folderExists = await Folder.exists({ user_id: user_id, _id: call.request.folder_id });
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
    if (error.name === "CastError")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Folder ID invalid" });
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
    const fileContent = await File.find({ user_id: user_id, _id: call.request.file_id }).select("content").lean();

    if (!fileContent) return callback({ code: grpc.status.NOT_FOUND, details: "File doesn't exist" });

    callback(null, { content: fileContent.content });
  } catch (error) {
    console.log(error);
    if (error === "Invalid token/Session expired")
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        details: error,
      });
    if (error.name === "CastError") return callback({ code: grpc.status.INVALID_ARGUMENT, details: "File ID invalid" });
    callback({
      code: grpc.status.UNKNOWN,
      details: error,
    });
  }
};

exports.MoveFile = async (call, callback) => {
  try {
    // Check authentication
    const user_id = checkAuth(call.metadata);

    // Check if file details are given
    if (call.request.file_id === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "File ID required" });
    if (call.request.dst_folder_id === "")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "Destination folder ID required" });

    // Check if destination folder exist
    const folderExists = await Folder.exists({ user_id: user_id, _id: call.request.dst_folder_id });
    if (!folderExists) return callback({ code: grpc.status.NOT_FOUND, details: "Destination folder doesn't exist" });

    // Update folder_id for the given file
    const updateFile = await File.updateOne(
      { user_id: user_id, _id: call.request.file_id },
      { folder_id: folderExists._id }
    );

    if (updateFile.matchedCount === 0) return callback({ code: grpc.status.NOT_FOUND, details: "File doesn't exist" });

    callback(null, { message: "success" });
  } catch (error) {
    console.log(error);
    if (error === "Invalid token/Session expired")
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        details: error,
      });
    if (error.name === "CastError")
      return callback({ code: grpc.status.INVALID_ARGUMENT, details: "File/Folder ID invalid" });
    callback({
      code: grpc.status.UNKNOWN,
      details: error,
    });
  }
};
