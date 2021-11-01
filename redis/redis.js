require("dotenv").config();
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

client.on("ready", () => {
  console.log("Redis connected");
});

client.on("error", function (er) {
  console.log(er.stack);
});

const CacheSystem = {};

CacheSystem.getAsync = promisify(client.get).bind(client);

CacheSystem.setAsync = promisify(client.set).bind(client);

module.exports = CacheSystem;
