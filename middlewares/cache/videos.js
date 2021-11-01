const redisPool = require("../../redis/redis");
const apiMessages = require("../../shared/apiMessages");
const VideoCache = {};

VideoCache.allVideos = async (req, res, next) => {
  try {
    const reply = await redisPool.getAsync("allVideos");

    if (reply) {
      console.log("Cache: all videos");
      const ret = apiMessages.getResponseByCode(1006);
      ret.result = JSON.parse(reply);
      res.status(ret.status).json(ret);
    } else next();
  } catch (err) {
    console.log(err);
    next();
  }
};

module.exports = VideoCache;
