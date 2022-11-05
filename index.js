const PROTO_PATH = __dirname + "/protos/files.proto";
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const userController = require("./controllers/users");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//MongoDB Connection
require("mongoose")
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });

//gRPC load proto file
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
