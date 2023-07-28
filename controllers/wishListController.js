// Application modules.
const apiMessages = require('./../shared/apiMessages');
const Video = require('./../models/video');
const WishList = require('./../models/wishList');
const UserVotes = require('./../models/userVotes');
const userVotesHelper = require('./helpers/userVotes');
const nowUtc = require('./../shared/dateTime').nowUtc;
const msleep = require("../shared/helperFunctions").msleep;
const convertISO8601ToSeconds = require("../shared/helperFunctions").convertISO8601ToSeconds;
const request = require("request");
const conf = require("../shared/config")();
const decryptData = require("../shared/decryptData");

// The controller itself.
const wishListController = {

  addOne: (req, res) => {
    const youTubeId = req.body.youTubeId;

    // Let's first search in videos collection.
    Video.findOne({ youtube_id: youTubeId }).populate({ path: "audio_descriptions" }).exec((err1, video) => { /* updated on 03/08/2020 */
      if (err1) {
        console.log(err1);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
        return;
      }

      // Video with !!!!!!published!!!!!! AD already exists.  /* updated on 03/08/2020 */
      let published = false;                                  /* updated on 03/08/2020 */
      if (video) {                                            /* updated on 03/08/2020 */
        const audioDescriptions = video.audio_descriptions;   /* updated on 03/08/2020 */
        for (var i = 0; i < audioDescriptions.length; ++i) {  /* updated on 03/08/2020 */
          if (audioDescriptions[i].status == "published") {   /* updated on 03/08/2020 */
            published = true;                                 /* updated on 03/08/2020 */
            break;                                            /* updated on 03/08/2020 */
          }                                                   /* updated on 03/08/2020 */
        }                                                     /* updated on 03/08/2020 */
      }                                                       /* updated on 03/08/2020 */
      if (published) {                                        /* updated on 03/08/2020 */
        const ret = apiMessages.getResponseByCode(50);
        res.status(ret.status).json(ret);
      } else {
        const userId = req.body.userId;
        UserVotes.findOne({ user: userId, youtube_id: youTubeId }, (err, data) => {
          if (data) {
            // Already voted.
            const ret = apiMessages.getResponseByCode(67);
            res.status(ret.status).json(ret);
          } else {
            // Vote accepted.
            userVotesHelper.add(userId, youTubeId)
              .then(userVotes => {

                // Let's now search at wishlist collection.
                WishList.findOne({ youtube_id: youTubeId }, (err2, wishListItem) => {

                  // Error handling.
                  if (err2) {
                    console.log(err2);
                    const ret = apiMessages.getResponseByCode(1);
                    res.status(ret.status).json(ret);
                    return;
                  }

                  // We already have in the database the video requested.
                  if (wishListItem) {
                    // Let's increment the requested cunter.
                    wishListItem.votes += 1;
                    wishListItem.updated_at = nowUtc();
                    wishListItem.save()
                      .then((item) => {
                        const ret = apiMessages.getResponseByCode(1009);
                        ret.result = item;
                        res.status(ret.status).json(ret);
                      })
                      .catch((errSave) => {
                        console.log(errSave);
                        const ret = apiMessages.getResponseByCode(1);
                        res.status(ret.status).json(ret);
                        return;
                      });
                  } else {
                    // Let's create.
                    const newWishList = new WishList({
                      youtube_id: youTubeId,
                      votes: 1,
                      status: 'queued',
                      created_at: nowUtc(),
                      updated_at: nowUtc(),
                    });
                    newWishList.save((errSaving, wishListItemSaved) => {
                      if (errSaving) {
                        console.log(errSaving);
                        const ret = apiMessages.getResponseByCode(1);
                        res.status(ret.status).json(ret);
                      }
                      /* start of new youtube infocard */
                      request.get(`${conf.youTubeApiUrl}/videos?id=${wishListItemSaved.youtube_id}&part=contentDetails,snippet,statistics&forUsername=iamOTHER&key=${conf.youTubeApiKey}`, function optionalCallback(err, response, body) {
                        if (!err) {
                          const jsonObj = JSON.parse(body);
                          if (jsonObj.items.length > 0) {
                            const duration = convertISO8601ToSeconds(jsonObj.items[0].contentDetails.duration);
                            const tags = (jsonObj.items[0].snippet.tags || []);
                            const categoryId = jsonObj.items[0].snippet.categoryId;
                            request.get(`${conf.youTubeApiUrl}/videoCategories?id=${categoryId}&part=snippet&forUsername=iamOTHER&key=${conf.youTubeApiKey}`, function optionalCallback(err, response, body) {
                              const jsonObj = JSON.parse(body);
                              let category = "";
                              for (var i = 0; i < jsonObj.items.length; ++i) {
                                if (i > 0) {
                                  category += ",";
                                }
                                category += jsonObj.items[i].snippet.title;
                              }
                              const toUpdate = {
                                tags: tags,
                                category_id: categoryId,
                                category: category,
                                duration: duration,
                                youtube_status: "available",
                              };
                              WishList.findOneAndUpdate(
                                { youtube_id: wishListItemSaved.youtube_id },
                                { $set: toUpdate },
                                { new: true }
                              ).exec();
                            });
                          } else {
                            const toUpdate = {
                              youtube_status: "unavailable",
                            };
                            WishList.findOneAndUpdate(
                              { youtube_id: wishListItemSaved.youtube_id },
                              { $set: toUpdate },
                              { new: true }
                            ).exec();
                          }
                        }
                      });
                      /* end of new youtube infocard */
                      const ret = apiMessages.getResponseByCode(1001);
                      ret.result = wishListItemSaved;
                      res.status(ret.status).json(ret);
                    })
                  }
                });
              })
              .catch(err => {
                console.log('Error', err);
              })
          }
        });
      }
    });
  },

  getOne: (req, res) => {
    const youTubeId = req.params.youTubeId;
    WishList.findOne({ youtube_id: youTubeId })
      .then((wishListItem) => {
        if (wishListItem) {
          const ret = apiMessages.getResponseByCode(1002);
          ret.result = wishListItem;
          res.status(ret.status).json(ret);
        } else {
          const ret = apiMessages.getResponseByCode(52);
          res.status(ret.status).json(ret);
        }
      })
      .catch((err) => {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      });
  },

  getAllWithSearch: (req, res) => {
    const pgNumber = Number(req.query.page) || 1;
    const perPage = Number(req.query.per_page) || 10;
    console.log('Query Stats', pgNumber, perPage);
    let searchQuery = "";
    let categoryQuery = "";
    if (req.query.search) {
      searchQuery = req.query.search.split("%20").join(" ");
    }
    if (req.query.category) {
      const queryCategories = req.query.category.split(",");
      const categories = queryCategories.map((category) =>
        category.split("%20").join(" ")
      );
      categoryQuery = categories.join("|");
    }
    const requestedVideoAmount =
      pgNumber === NaN || pgNumber === 0 ? perPage : pgNumber * perPage;
    WishList.aggregate()
      .facet({
        items: [
          {
            $match: {
              $and: [
                { status: "queued" },
                { youtube_status: "available" },
                { tags: { $regex: searchQuery, $options: "i" } },
                { category: { $regex: categoryQuery, $options: "i" } },
              ],
            },
          },
          { $sort: { votes: -1 } },
          { $skip: requestedVideoAmount - perPage },
          { $limit: perPage },
        ],
        count: [
          {
            $match: {
              $and: [
                { status: "queued" },
                { youtube_status: "available" },
                { tags: { $regex: searchQuery, $options: "i" } },
                { category: { $regex: categoryQuery, $options: "i" } },
              ],
            },
          },
          { $count: "count" },
        ],
      })
      .then((items) => {
        const pageItems = items[0].items;
        const count = items[0].count[0].count;
        if (pageItems) {
          const ret = apiMessages.getResponseByCode(1008);
          ret.result = { items: pageItems, count: count };
          res.status(ret.status).json(ret);
        } else {
          const ret = apiMessages.getResponseByCode(61);
          res.status(ret.status).json(ret);
        }
      })
      .catch((err) => {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        ret.result = { items: [], count: 0 };
        res.status(ret.status).json(ret);
      });
  },

  getAll: (req, res) => {
    const pgNumber = Number(req.query.page);
    const requestedVideoAmount = (pgNumber === NaN || pgNumber === 0) ? 15 : (pgNumber * 15);
    WishList.find({ status: 'queued' })
      // .sort({ votes: -1 }).skip(requestedVideoAmount - 15).limit(15)
      .sort({ created_at: -1 }).skip(requestedVideoAmount - 15).limit(15)
      .then((items) => {
        if (items) {
          const ret = apiMessages.getResponseByCode(1008);
          ret.result = items;
          res.status(ret.status).json(ret);
        } else {
          const ret = apiMessages.getResponseByCode(61);
          res.status(ret.status).json(ret);
        }
      })
      .catch((err) => {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      });
  },

  getTop: (req, res) => {
    console.log("========GET TOP========")
    console.log(req.headers.user_creds);
    let user_id = null;
    if (req.headers.user_creds) {
      user_id = decryptData(req.headers.user_creds);
      console.log("user_id", user_id)
    }
    if (user_id != null) {
      UserVotes.find({ user: user_id }).then((userVotes) => {
        console.log("userVotes", userVotes)

      }).catch((err) => {
        console.log("err", err)
      })
    }

    WishList.find({ status: "queued", youtube_status: "available" })
      .sort({ votes: -1 })
      .limit(5)
      .then((items) => {
        if (items) {
          const ret = apiMessages.getResponseByCode(1008);
          ret.result = items;
          res.status(ret.status).json(ret);
        } else {
          const ret = apiMessages.getResponseByCode(61);
          res.status(ret.status).json(ret);
        }
      })
      .catch((err) => {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      });
  },

  updateOne: (req, res) => {
    const youTubeId = req.params.youTubeId;

    WishList.findOneAndUpdate({ youtube_id: youTubeId }, { $set: { status: 'dequeued', updated_at: nowUtc() } }, (err, wishList) => {
      if (err) {
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }
      if (wishList) {
        const ret = apiMessages.getResponseByCode(1010);
        ret.result = wishList;
        res.status(ret.status).json(ret);
      } else {
        const ret = apiMessages.getResponseByCode(62);
        res.status(ret.status).json(ret);
      }
    });
  },

  getByCategories: (req, res) => {
    const limit = req.query.limit || 7;
    const slice = req.query.slice || 4;
    WishList.aggregate([
      { $match: { category: { $ne: "" }, status: "queued" } },
      { $sort: { votes: -1 } },
      {
        $group: {
          _id: "$category",
          data: { $push: { "youtube_id": "$youtube_id", "votes": "$votes" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          data: { $slice: ["$data", slice] },
          count: "$count"
        }
      }
    ]).collation({ locale: "en" }).exec((err, videos) => {
      const ret = { status: 200 };
      ret.result = videos;
      res.status(ret.status).json(ret);
    });
  },
};

module.exports = wishListController;
