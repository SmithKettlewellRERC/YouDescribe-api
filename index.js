const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan')
const port = process.env.PORT || 8080;
const app = express();
app.use(morgan('combined'));
const audioClips = require('./routes/audioClips');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

app.use('/audioClips', audioClips);

// app.use((err, req, res, next) => {
//   res.status(err.status || 500).json(err);
// });

app.get('*', (req, res) => {
  // res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  res.status(200).json('{"status":"ok"}');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
