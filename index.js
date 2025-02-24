// const { NODE_ENV } = process.env;
const NODE_ENV = "prd";
const path = require("path");
const bodyParser = require("body-parser");
const conf = require("./shared/config")();
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const passport = require("passport");
const http = require("http");
const cluster = require("cluster");
const numWorkers = require("os").cpus().length;
const app = express();
var moment = require("moment");

// global number of videos fetched from youtube api service
numOfVideosFromYoutube = 0;
var midnight = "12:00:00";
var now = null;
setInterval(function () {
  now = moment().format("H:mm:ss");
  console.log(
    "number of videos fetched from youtube api service" + numOfVideosFromYoutube
  );
}, 60 * 15 * 1000);

//reset videos at midnight
setInterval(function () {
  now = moment().format("H:mm:ss");
  if (now === midnight) {
    numOfVideosFromYoutube = 0;
  }
}, 1000);


const allowedOrigins = ["https://youdescribe.org", "https://test.youdescribe.org", "https://ydx.youdescribe.org", "https://ydx-dev.youdescribe.org", "http://localhost:3000"]

var corsOptions = {
  origin: (origin, callback) => {
    if(!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`${origin} Not allowed by CORS`))
    }
  },
  credentials: true,
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(cookieSession({
  name: 'auth-session',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  secret: "YouDescribe Secret"
}));
app.use(passport.initialize());
app.use(passport.session());

// Database.
const db = require("./db/connection");

// Compression.
const compression = require("compression");
app.use(compression());

// Logs library.
const morgan = require("morgan");
app.use(morgan("combined"));

// Server HTTP port setup.
const port = 8080;

// CORS.
// if (NODE_ENV === "dev") {
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  if(allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Accept, Authorization, Content-Type, X-Requested-With, Range, Content-Length, Visit"
  );
  if (req.method === "OPTIONS") {
    return next();
  } else {
    return next();
  }
});
// }

// Our server routes.
const auth = require("./routes/auth");
const wishList = require("./routes/wishList");
const videos = require("./routes/videos");
const audioClips = require("./routes/audioClips");
const users = require("./routes/users");
const audioDescriptions = require("./routes/audioDescriptions");
const audioDescriptionsRating = require("./routes/audioDescriptionsRating");
const languages = require("./routes/languages");
const admins = require("./routes/admins");
const statistics = require("./routes/statistics");

// Middleware for routes.
app.use(`/${conf.apiVersion}/auth`, auth);
app.use(`/${conf.apiVersion}/wishlist`, wishList);
app.use(`/${conf.apiVersion}/videos`, videos);
app.use(`/${conf.apiVersion}/audioclips`, audioClips);
app.use(`/${conf.apiVersion}/users`, users);
app.use(`/${conf.apiVersion}/audiodescriptions`, audioDescriptions);
app.use(`/${conf.apiVersion}/audiodescriptionsrating`, audioDescriptionsRating);
app.use(`/${conf.apiVersion}/languages`, languages);
app.use(`/${conf.apiVersion}/admins`, admins);
app.use(`/${conf.apiVersion}/statistics`, statistics);

// Static route for wav files.
console.log("File path for wav files", conf.uploadsRootDirToServe);
app.use(
  "/audio-descriptions-files",
  express.static(conf.uploadsRootDirToServe)
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong.");
});

// The Restful API drain.
app.get("*", (req, res) => {
  res.status(200).json('{"status":"not found"}');
});

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? `Pipe  ${port}` : `Port ${port}`;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running.`);
  console.log(`Master cluster setting up ${numWorkers} workers...`);

  for (let i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }

  cluster.on("online", (worker) => {
    console.log(`Worker (child process) ${worker.process.pid} is running.`);
  });

  /**
   * To make sure we do not loose any workers.
   */
  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}.`
    );
    console.log("Starting a new worker.");
    cluster.fork();
  });
} else {
  /**
   * Starting HTTP server (each worker will start one process).
   */
  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    console.log(
      `Child process ${process.pid} is listening to all incoming requests on port ${port}.`
    );
  });

  /**
   * Errors listener.
   */
  httpServer.on("error", onError);
}

process.on("uncaughtException", function (err) {
  console.log(err);
  console.log(err.stack);
});
