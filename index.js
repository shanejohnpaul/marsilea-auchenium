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

//gRPC create service
server.addService(filesProto.FileService.service, {
  Login: userController.Login,
  Register: userController.Register,
});

server.bindAsync(`0.0.0.0:${process.env.PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  server.start();
  console.log(`Server running at grpc://0.0.0.0:${process.env.PORT}`);
});
