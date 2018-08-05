const { NODE_ENV } = process.env;
const path = require('path');
const bodyParser = require('body-parser');
const conf = require('./shared/config')();
const express = require('express');
const http = require('http');
const cluster = require('cluster');
const numWorkers = require('os').cpus().length;
const app = express();


app.use(bodyParser.json());

// Database.
const db = require('./db/connection');

// Compression.
const compression = require('compression');
app.use(compression());

// Logs library.
const morgan = require('morgan');
app.use(morgan('combined'));

// Server HTTP port setup.
const port = NODE_ENV === 'dev' ? '8080' : '3000';

// CORS.
if (NODE_ENV === 'dev') {
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range, Content-Length');
    if (req.method === 'OPTIONS') {
      return next();
    } else {
      return next();
    }
  });
}

// Our server routes.
const auth = require('./routes/auth');
const wishList = require('./routes/wishList');
const videos = require('./routes/videos');
const audioClips = require('./routes/audioClips');
const users = require('./routes/users');
const audioDescriptions = require('./routes/audioDescriptions');
const audioDescriptionsRating = require('./routes/audioDescriptionsRating');
const languages = require('./routes/languages');

// Middleware for routes.
app.use(`/${conf.apiVersion}/auth`, auth);
app.use(`/${conf.apiVersion}/wishlist`, wishList);
app.use(`/${conf.apiVersion}/videos`, videos);
app.use(`/${conf.apiVersion}/audioclips`, audioClips);
app.use(`/${conf.apiVersion}/users`, users);
app.use(`/${conf.apiVersion}/audiodescriptions`, audioDescriptions);
app.use(`/${conf.apiVersion}/audiodescriptionsrating`, audioDescriptionsRating);
app.use(`/${conf.apiVersion}/languages`, languages);

// Static route for wav files.
console.log('File path for wav files', conf.uploadsRootDirToServe);
app.use('/audio-descriptions-files', express.static(conf.uploadsRootDirToServe));

// The Restful API drain.
app.get('*', (req, res) => {
  res.status(200).json('{"status":"not found"}');
});

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? `Pipe  ${port}` : `Port ${port}`;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
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

  cluster.on('online', (worker) => {
    console.log(`Worker (child process) ${worker.process.pid} is running.`);
  });

  /**
   * To make sure we do not loose any workers.
   */
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}.`);
    console.log('Starting a new worker.');
    cluster.fork();
  });
} else {
  /**
   * Starting HTTP server (each worker will start one process).
   */
  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    console.log(`Child process ${process.pid} is listening to all incoming requests on port ${port}.`);
  });

  /**
   * Errors listener.
   */
  httpServer.on('error', onError);
}
