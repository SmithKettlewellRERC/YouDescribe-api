const nowUtc = require("../../shared/dateTime").nowUtc;
const Video = require("../../models/video");
const User = require("../../models/user");
const utcToLongInt = require("../../shared/helperFunctions").utcToLongInt;
module.exports = {
  weeklyVideoCount: async () => {
    var days = 7;
    var endDate = new Date().getTime();
    var startDate = new Date(endDate - days * 24 * 60 * 60 * 1000).getTime();

    startDate = utcToLongInt(startDate);
    endDate = utcToLongInt(endDate);

    const videos = Video.aggregate([
      {
        $match: {
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgduration: { $avg: "$duration" }
        }
      }
    ]);
    const result = await videos.exec();
    let result2 = {
      count: result.length > 0 ? result[0].count : 0,
      avgduration: result.length > 0 ? round(result[0].avgduration) / 60 : 0
    };
    return result2;
  },
  weeklyWishlistCount: async () => {
    var days = 7;
    var endDate = new Date().getTime();
    var startDate = new Date(endDate - days * 24 * 60 * 60 * 1000).getTime();

    startDate = utcToLongInt(startDate);
    endDate = utcToLongInt(endDate);

    const videos = Wishlist.aggregate([
      {
        $match: {
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgduration: { $avg: "$duration" }
        }
      }
    ]);
    const result = await videos.exec();
    let result2 = {
      count: result.length > 0 ? result[0].count : 0,
      avgduration: result.length > 0 ? round(result[0].avgduration) / 60 : 0
    };
    return result2;
  },
  weeklyUserCount: async () => {
    var days = 7;
    var endDate = new Date().getTime();
    var startDate = new Date(endDate - days * 24 * 60 * 60 * 1000).getTime();

    startDate = utcToLongInt(startDate);
    endDate = utcToLongInt(endDate);

    const users = User.aggregate([
      {
        $match: {
          $and: [
            { updated_at: { $gte: startDate } },
            { updated_at: { $lt: endDate } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);
    const result = await users.exec();
    let result2 = {
      count: result.length > 0 ? result[0].count : 0
    };
    return result2;
  }
};
