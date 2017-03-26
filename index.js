// Our web framework itself.
const path = require('path');
const bodyParser = require('body-parser');
const conf = require('./shared/config')();
const express = require('express');
const app = express();
// CORS + CSRF https://expressjs.com/en/resources/middleware/cors.html

app.use(bodyParser.json());

// Database.
const db = require('./db/connection');

// Compression.
// const compression = require('compression');
// app.use(compression());

// Logs library.
// const morgan = require('morgan');
// app.use(morgan('combined'));

// Server HTTP port setup.
const port = process.env.PORT || 8080;

// HEADERS { host: 'localhost:8080',
//   connection: 'keep-alive',
//   'content-length': '344812',
//   origin: 'http://localhost:3000',
//   'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
//   'content-type': 'multipart/form-data; boundary=----WebKitFormBoundarya9eBbiNmdJWkOam4',
//   accept: '*/*',
//   referer: 'http://localhost:3000/authoring-tool/qwe',
//   'accept-encoding': 'gzip, deflate, br',
//   'accept-language': 'en-US,en;q=0.8,pt-BR;q=0.6,pt;q=0.4' }


// CORS.
app.use(function(req, res, next) {
  // res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Credentials', 'true');
  // res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  // res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  if (req.method === 'OPTIONS') {
    // console.log('OPTIONS');
    return next();
    return res.send(200);
  } else {
    return next();
  }
});

// Our server routes.
const auth = require('./routes/auth');
const wishList = require('./routes/wishList');
const videos = require('./routes/videos');
const audioClips = require('./routes/audioClips');

// Middleware for routes.
app.use(`/${conf.apiVersion}/auth`, auth);
app.use(`/${conf.apiVersion}/wishlist`, wishList);
app.use(`/${conf.apiVersion}/videos`, videos);
app.use(`/${conf.apiVersion}/audioclips`, audioClips);

// Statis route for wav files.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// The Restful API drain.
app.get('*', (req, res) => {
  res.status(200).json('{"status":"not found"}');
});

// Starting the port listener.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
