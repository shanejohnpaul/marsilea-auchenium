# Files API

A simple Files API to store and manage files and folders.

# Environment vars

This project uses the following environment variables:

| Name         | Description                        | Default Value |
| ------------ | ---------------------------------- | ------------- |
| PORT         | Server port                        | 8080          |
| MONGODB_URI  | MongoDB URI                        | -             |
| TOKEN_SECRET | JWT token secret                   | -             |
| TOKEN_EXPIRY | JWT token expiry time (in seconds) | -             |

# Installation & Run

- Clone the repository

```
git clone https://github.com/shanejohnpaul/marsilea-auchenium.git
```

- Install dependencies

```
cd marsilea-auchenium
npm install
```

- Create .env file (use .env.example as reference)

- Run

```
npm start
```

**NOTE:** For deployment install packages using `npm install --production` and set `NODE_ENV` environment variable to `production`. Set other environment variables before running.

# Deploy using Docker

- Build the docker image

```
docker build . -t files-api
```

- Run the image (mention environment variables through a file, or as options)

```
docker run -d -p 50051:8080 --env-file .env files-api
```

or

```
docker run -d -p 50051:8080 \
-e PORT='8080' \
-e MONGODB_URI='mongodb-uri-goes-here' \
-e TOKEN_SECRET='jwt-token-secret-goes-here' \
-e 'jwt-token-expiry-time-in-seconds-goes-here' \
files-api
```

**NOTE:** Always set `PORT` variable to `8080` since the Dockerfile exposes that same port. Omitting the `PORT` variable will also run the application at port `8080`.

# API Specifications

Please refer the `protos/files.proto` file for the full API specifications.

## Highlights of the API specification

- **Register** - Registers a new user
- **Login** - Returns a token, given a valid username and password
- **GetFolderContent** - Gets contents of a folder when folder ID is given (when folder ID is not given, returns the contents of the root folder)
- **GetFileContent** - Gets contents of a file given the file ID
- **CreateFile** - Creates a new file (when folder ID is not given create a file in the root folder)
- **CreateFolder** - Create a new folder
- **MoveFile** - Moves a file between folders, given the file ID and destination folder ID

**NOTE:** Token is sent via the `authorization` metadata field and is required for all requests except `Register` and `Login`
