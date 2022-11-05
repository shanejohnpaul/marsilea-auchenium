var PROTO_PATH = __dirname + "/protos/files.proto";
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");

// Suggested options for similarity to existing grpc.load behavior
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  arrays: true,
  defaults: true,
});

var filesProto = grpc.loadPackageDefinition(packageDefinition);

var server = new grpc.Server();

server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
  server.start();
  console.log("Server running at grpc://0.0.0.0:50051");
});
