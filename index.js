// General imports.
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db/connection');

// Logs library.
const morgan = require('morgan');

// Server HTTP port setup.
const port = process.env.PORT || 8080;

// Our web framework itself.
const app = express();

// Apache format logs.
app.use(morgan('combined'));

// Body parser middleware setup.
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// Our server routes.
const videos = require('./routes/videos');

// Middleware for routes.
app.use('/videos', videos);

// The Restful API drain.
app.get('*', (req, res) => {
  res.status(200).json('{"status":"ok"}');
});

// Starting the port listener.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
