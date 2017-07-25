![](https://raw.githubusercontent.com/decentraland/web/gh-pages/img/decentraland.ico)

# Web dashboard

Web interface to manage the Decentraland node.<br>
Below you can find how to build and run the dashboard, but for most cases, running `./bin/start` on the root `bronzeage-node` project should be enough!

## Server

The server runs by executing the `server.js` file via a simple node command. Remember to have the node running!

The most important flag is `apikey`, which you can set like this:

```
node server.js --apikey YOUR_API_KEY
```

The server supports some configuration flags, the most useful being:
- `serverport`: defaults to 5000
- `api`: If set, the server won't serve any files, and it'll act just as an API

## Building the Dasboard

A pre-build version of the dashboard lives on the `/build` folder. But if you want add new features or maybe be sure you have the last version, you first have to install all the necessary dependencies by running `npm install` on this folder (`/browser`).<br>
Then, after that, you're ready to run the dashboard! you have two options:

**Development**

```
# Tab 1. It starts the React static webserver
npm start

# Tab 2
node server.js --apikey YOUR_API_KEY --serverport 5000 --api
```

**Production**

```
# Tab 1. Compiles the files to the /build folder
npm run build

# Tab 2 (note the lack of `--api` flag)
node server.js --apikey YOUR_API_KEY --serverport 5000
```


### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

### ENV

To change the port of the API you can use the `REACT_APP_API_PORT` env variable like this:

```
REACT_APP_API_PORT=4500 npm run build
```

By default, it'll use the port 5000 to connect.

Same as above, you can use `REACT_APP_API_URL` to change the default URL, which points to `localhost` by default
