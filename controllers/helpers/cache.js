const redisPool = require("../../redis/redis");

const Cache = {};

Cache.get = async (key) => {
  try {
    let test_value = await redisPool.getAsync(key);
    return test_value;
  } catch (err) {
    console.log(err);
    return null;
  }
};

Cache.set = async (key, value, expiration) => {
  try {
    let test = await redisPool.setAsync(key, value, "EX", expiration);
    console.log(test);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports = Cache;
