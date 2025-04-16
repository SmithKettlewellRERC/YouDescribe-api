const mongoose = require("mongoose");

// Environment variables
var DB_HOST = "localhost";
if(process.env.DB_HOST != null && process.env.DB_HOST.length > 0) {
  DB_HOST = process.env.DB_HOST;
}

var DB_PORT = "27020";  // Using Nginx proxy port
if(process.env.DB_PORT != null && process.env.DB_PORT.length > 0) {
  DB_PORT = process.env.DB_PORT;
}

// Connection string
const uri = `mongodb://youdescribe:E2E32fgklsdfiefwefmm6gyT@${DB_HOST}:${DB_PORT}/youdescribe`;

// Improved connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  serverSelectionTimeoutMS: 30000,    // Increased timeout
  connectTimeoutMS: 30000,            // Increased connection timeout
  socketTimeoutMS: 60000,             // Socket timeout
  keepAlive: true,                    // Keep connection alive
  keepAliveInitialDelay: 300000,      // 5 minutes
};

// Connection with retry
function connectWithRetry() {
  console.log(`MongoDB connection attempt to ${DB_HOST}:${DB_PORT}...`);
  
  mongoose.connect(uri, options)
    .then(() => {
      console.log("Successfully connected to MongoDB");
    })
    .catch(err => {
      console.error(`MongoDB connection error: ${err.message}`);
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
}

// Event listeners for connection issues
mongoose.connection.on("error", err => {
  console.error(`MongoDB connection error: ${err.message}`);
  if (err.name === 'MongoNetworkError') {
    console.log("Network error detected, attempting reconnection...");
    setTimeout(connectWithRetry, 5000);
  }
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected, attempting to reconnect...");
  setTimeout(connectWithRetry, 5000);
});

// Initial connection
connectWithRetry();

module.exports = mongoose.connection;
