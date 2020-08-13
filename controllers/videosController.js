// Application modules.
const apiMessages = require("./../shared/apiMessages");
const Video = require("./../models/video");
const AudioDescription = require("./../models/audioDescription");
const AudioDescriptionRating = require("./../models/audioDescriptionRating");
const User = require("./../models/user");
const AudioClip = require("./../models/audioClip");
const WishList = require("./../models/wishList");
const ObjectId = require("mongoose").Types.ObjectId;
const nowUtc = require("./../shared/dateTime").nowUtc;
const msleep = require("../shared/helperFunctions").msleep;
const convertISO8601ToSeconds = require("../shared/helperFunctions")
  .convertISO8601ToSeconds;
const request = require("request");
const conf = require("../shared/config")();
let cache = require("memory-cache");

//updating videos at midnight
setInterval(function() {
  now = moment().format("H:mm:ss");
  if (now === midnight) {
    const youTubeApiKey = "AIzaSyBaJHiKgT4KW58WJ26tH4PIIQE6vbOvU8w"; // google cloud project: youdescribeadm@gmail.com -> youdescribe-0616
    Video.find({
      $or: [{ youtube_status: "" }, { youtube_status: { $exists: false } }]
    })
      .limit(1000)
      .exec((err, videos) => {
        videos.forEach(video => {
          request.get(
            `${conf.youTubeApiUrl}/videos?id=${video.youtube_id}&part=contentDetails,snippet,statistics&forUsername=iamOTHER&key=${youTubeApiKey}`,
            function optionalCallback(err, response, body) {
              if (!err) {
                const jsonObj = JSON.parse(body);
                if (jsonObj.items.length > 0) {
                  const duration = convertISO8601ToSeconds(
                    jsonObj.items[0].contentDetails.duration
                  );
                  const tags = jsonObj.items[0].snippet.tags || [];
                  const categoryId = jsonObj.items[0].snippet.categoryId;
                  request.get(
                    `${conf.youTubeApiUrl}/videoCategories?id=${categoryId}&part=snippet&forUsername=iamOTHER&key=${youTubeApiKey}`,
                    function optionalCallback(err, response, body) {
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
                        youtube_status: "available"
                      };
                      Video.findOneAndUpdate(
                        { youtube_id: video.youtube_id },
                        { $set: toUpdate },
                        { new: true }
                      ).exec((err, ac) => {
                        console.log(video.youtube_id + "; available");
                      });
                    }
                  );
                } else {
                  const toUpdate = {
                    youtube_status: "unavailable"
                  };
                  Video.findOneAndUpdate(
                    { youtube_id: video.youtube_id },
                    { $set: toUpdate },
                    { new: true }
                  ).exec((err, ac) => {
                    console.log(video.youtube_id + "; unavailable");
                  });
                }
              }
            }
          );
          msleep(10);
        });
      });
  }
}, 1000);

// The controller itself.
const videosController = {
  // addOne: (req, res) => {
  //   const id = req.body.id;
  //   Video.findOne({ _id: id })
  //   .then((video) => {
  //     if (video) {
  //       const ret = apiMessages.getResponseByCode(56);
  //       res.status(ret.status).json(ret);
  //     } else {
  //       const newVideoData = {
  //         _id: id,
  //         status: 'published',
  //         views: 0,
  //         created_at: nowUtc(),
  //         updated_at: nowUtc(),
  //         language: 1,
  //         title: req.body.title,
  //         description: req.body.description,
  //         notes: req.body.notes,
  //         audio_descriptions: {},
  //       };
  //       const newVideo = new Video(newVideoData);
  //       newVideo.save()
  //       .then((newVideoSaved) => {
  //         console.log('AAAAAAA');
  //         const ret = apiMessages.getResponseByCode(1003);
  //         ret.result = newVideoSaved;
  //         res.status(ret.status).json(ret);
  //         res.end();
  //       })
  //       .catch((err3) => {
  //         console.log('BBBBBBBBBB');
  //         console.log(err3);
  //         const ret = apiMessages.getResponseByCode(1);
  //         res.status(ret.status).json(ret);
  //       });
  //     }
  //   })
  //   .catch((err) => {
  //     console.log('CCCCCCC');
  //     console.log(err);
  //     const ret = apiMessages.getResponseByCode(1);
  //     res.status(ret.status).json(ret);
  //   });
  // },

  // updateOne: (req, res) => {
  //   const id = req.params.id;
  //   const toUpdate = {};
  //   const notes = req.body.notes;
  //   const publish = req.body.publish;

  //   if (notes) toUpdate['notes'] = notes;
  //   if (publish) toUpdate['status'] = 'published';

  //   Video.findOneAndUpdate({ _id: id }, { $set: toUpdate }, { new: true }, (err, video) => {
  //     if (err) {
  //       console.log(err);
  //       const ret = apiMessages.getResponseByCode(1);
  //       res.status(ret.status).json(ret);
  //     }
  //     if (video) {
  //       const ret = apiMessages.getResponseByCode(1004);
  //       ret.result = video;
  //       res.status(ret.status).json(ret);
  //     } else {
  //       const ret = apiMessages.getResponseByCode(57);
  //       res.status(ret.status).json(ret);
  //     }
  //   });
  // },

  getOne: (req, res) => {
    const youtube_id = req.params.id;
    Video.findOne({ youtube_id })
      .populate({
        path: "audio_descriptions",
        populate: {
          path: "user audio_clips"
        }
      })
      .exec((errGetOne, video) => {
        if (errGetOne) {
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }
        if (video) {
          const newVideo = video.toJSON();
          const promisesQueue = [];
          const audioDescriptions = newVideo.audio_descriptions.slice();
          newVideo.audio_descriptions = [];
          audioDescriptions.forEach(ad => {
            const adId = ad._id;
            const query = AudioDescriptionRating.find({
              audio_description_id: adId
            });
            const promise = query.exec();
            ad.feedbacks = {};
            promise.then(audioDescriptionRating => {
              if (audioDescriptionRating && audioDescriptionRating.length > 0) {
                audioDescriptionRating.map(adr => {
                  if (adr.feedback.length > 0) {
                    adr.feedback.map(item => {
                      if (!ad.feedbacks.hasOwnProperty(item)) {
                        ad.feedbacks[item] = 0;
                      }
                      ad.feedbacks[item] += 1;
                    });
                  }
                });
              }
              newVideo.audio_descriptions.push(ad);
            });
            promisesQueue.push(promise);
          });

          Promise.all(promisesQueue).then(() => {
            const ret = apiMessages.getResponseByCode(1000);
            ret.result = newVideo;
            res.status(ret.status).json(ret);
          });
        } else {
          const ret = apiMessages.getResponseByCode(55);
          res.status(ret.status).json(ret);
        }
      });
  },

  getVideosByUserId: (req, res) => {
    const userId = req.params.userId;
    AudioDescription.find({ user: userId })
      .limit(50)
      .sort({ updated_at: -1 })
      .exec((err, ads) => {
        if (err) {
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }

        const ret = apiMessages.getResponseByCode(1013);

        const arrayOfAdsIds = [];
        if (ads) {
          ads.forEach(ad => {
            arrayOfAdsIds.push(ad._id);
          });
        } else {
          ret.result = [];
          res.status(ret.status).json(ret);
        }

        Video.find({
          audio_descriptions: { $in: arrayOfAdsIds }
        }).exec((errVideos, videos) => {
          if (errVideos) {
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }
          if (videos) {
            ret.result = videos;
          } else {
            ret.result = [];
          }
          res.status(ret.status).json(ret);
        });
      });
  },

  getAll: (req, res) => {
    let pgNumber = Number(req.query.page);
    let searchPage = pgNumber === NaN || pgNumber === 0 ? 50 : pgNumber * 50;
    /* start of old method */
    Video.find({})
      .sort({ created_at: -1 })
      .skip(searchPage - 50)
      .limit(50)
      .populate({
        path: "audio_descriptions",
        populate: {
          path: "user audio_clips"
          // populate: {
          //   path: 'user'
          // }
        }
      })
      .exec((errGetAll, videos) => {
        if (errGetAll) {
          const ret = apiMessages.getResponseByCode(1);
          res.status(ret.status).json(ret);
        }
        const videosFiltered = [];
        videos.forEach(video => {
          let audioDescriptionsFiltered = [];
          video.audio_descriptions.forEach(ad => {
            if (ad.status === "published") {
              audioDescriptionsFiltered.push(ad);
            }
          });
          video.audio_descriptions = audioDescriptionsFiltered;
          if (audioDescriptionsFiltered.length > 0) {
            videosFiltered.push(video);
          }
        });
        const ret = apiMessages.getResponseByCode(1006);
        ret.result = videosFiltered;
        res.status(ret.status).json(ret);
      });
    /* end of old method */
    /* start of new method */
    // Video.aggregate([
    //   {$match: {"youtube_status": "available"}},
    //   {$unwind: "$audio_descriptions"},
    //   {$lookup: {from: "audio_descriptions", localField: "audio_descriptions", foreignField: "_id", as: "audio_description"}},
    //   {$unwind: "$audio_description"},
    //   {$match: {"audio_description.status": "published"}},
    //   {$group: {_id: "$_id", youtube_id: {$first: "$youtube_id"}, created_at: {$first: "$created_at"}}},
    //   {$sort: {created_at: -1}},
    // ]).collation({locale: "en"}).skip(searchPage - 50).limit(50).exec((err, videos) => {
    //   const ret = apiMessages.getResponseByCode(1006);
    //   ret.result = videos;
    //   res.status(ret.status).json(ret);
    // });
    /* end of new method */
  },

  search: (req, res) => {
    const searchTerm = req.query.q;
    const pgNumber = Number(req.query.page);
    const requestedVideoAmount =
      pgNumber === NaN || pgNumber === 0 ? 30 : pgNumber * 30;
    /* start of old method */
    // Video.find({ title: new RegExp(searchTerm, 'i') }).sort({ updated_at: -1 }).skip(requestedVideoAmount - 30).limit(30)
    // // Video.find({ $text: { $search: searchTerm }}).sort({ updated_at: -1 }).skip(requestedVideoAmount - 30).limit(30)
    // .populate({
    //   path: 'audio_descriptions',
    //   populate: {
    //     path: 'user audio_clips',
    //   }
    // })
    // .then((videos) => {
    //   const videosFiltered = [];
    //   videos.forEach(video => {
    //     let audioDescriptionsFiltered = [];
    //     video.audio_descriptions.forEach(ad => {
    //       if (ad.status === 'published') {
    //         audioDescriptionsFiltered.push(ad);
    //       }
    //     });
    //     video.audio_descriptions = audioDescriptionsFiltered;
    //     if (audioDescriptionsFiltered.length > 0) {
    //       videosFiltered.push(video);
    //     }
    //   });
    //   const ret = apiMessages.getResponseByCode(1007);
    //   ret.result = videosFiltered;
    //   res.status(ret.status).json(ret);
    // })
    // .catch((err) => {
    //   console.log(err);
    //   const ret = apiMessages.getResponseByCode(1);
    //   res.status(ret.status).json(ret);
    // });
    /* end of old method */
    /* start of new method */
    AudioDescription.aggregate([
      { $match: { status: "published" } },
      {
        $lookup: {
          from: "languages",
          localField: "language",
          foreignField: "code",
          as: "language"
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$language" },
      { $unwind: "$video" },
      { $unwind: "$user" },
      {
        $match: {
          $or: [
            { "language.name": { $regex: searchTerm, $options: "$i" } },
            { "video.youtube_id": { $regex: searchTerm, $options: "$i" } },
            { "video.category": { $regex: searchTerm, $options: "$i" } },
            { "video.title": { $regex: searchTerm, $options: "$i" } },
            {
              "video.tags": {
                $elemMatch: { $regex: searchTerm, $options: "$i" }
              }
            },
            {
              "video.custom_tags": {
                $elemMatch: { $regex: searchTerm, $options: "$i" }
              }
            },
            { "user.name": { $regex: searchTerm, $options: "$i" } }
          ]
        }
      },
      { $group: { _id: "$video" } },
      { $sort: { "_id.updated_at": -1 } }
    ])
      .skip(requestedVideoAmount - 30)
      .limit(30)
      .then(groups => {
        const videos = [];
        groups.forEach(group => {
          videos.push(group._id);
        });
        const ret = apiMessages.getResponseByCode(1007);
        ret.result = videos;
        res.status(ret.status).json(ret);
      })
      .catch(err => {
        console.log(err);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      });
    /* end of new method */
  },

  getAllByPage: (req, res) => {
    const keyword = req.query.keyword;
    const pageNumber = Number(req.query.page);
    var sortBy = req.query.sortby;
    if (sortBy == undefined || sortBy == "") {
      sortBy = "_id";
    }
    var order = parseInt(req.query.order);
    if (order == undefined || order != 1) {
      order = -1;
    }
    const endNumber = pageNumber === NaN ? 50 : pageNumber * 50;
    Video.aggregate([
      {
        $match: {
          $or: [
            { youtube_id: { $regex: keyword, $options: "$i" } },
            { category: { $regex: keyword, $options: "$i" } },
            { title: { $regex: keyword, $options: "$i" } },
            { tags: { $elemMatch: { $regex: keyword, $options: "$i" } } },
            { custom_tags: { $elemMatch: { $regex: keyword, $options: "$i" } } }
          ]
        }
      },
      { $sort: { [sortBy]: order, _id: order } }
    ])
      .collation({ locale: "en" })
      .exec((err, videos) => {
        const videosPaginated = [];
        for (var i = endNumber - 50; i < videos.length && i < endNumber; ++i) {
          videosPaginated.push(videos[i]);
        }
        const ret = { status: 200 };
        ret.count = videos.length;
        ret.result = videosPaginated;
        res.status(ret.status).json(ret);
      });
  },

  getById: (req, res) => {
    const id = req.query.id;
    Video.findOne({ _id: id })
      .populate({
        path: "audio_descriptions",
        populate: {
          path: "user audio_clips"
        }
      })
      .exec((err, video) => {
        const ret = { status: 200 };
        ret.result = video;
        res.status(ret.status).json(ret);
      });
  },

  getNext: (req, res) => {
    const keyword = req.query.keyword;
    const isNext = parseInt(req.query.isnext);
    const id = req.query.id;
    var sortBy = req.query.sortby;
    if (sortBy == undefined || sortBy == "") {
      sortBy = "_id";
    }
    var order = parseInt(req.query.order);
    if (order == undefined || order != 1) {
      order = -1;
    }
    const finalOrder = parseInt(isNext * order);
    const comparator = finalOrder > 0 ? "$gt" : "$lt";
    Video.findOne({ _id: id }).exec((err, video) => {
      var separator = "";
      if (sortBy == "_id") {
        separator = ObjectId(video._id);
      } else if (sortBy == "title") {
        separator = video.title;
      } else if (sortBy == "youtube_status") {
        separator = video.youtube_status;
      } else if (sortBy == "category") {
        separator = video.category;
      } else if (sortBy == "created_at") {
        separator = video.created_at;
      }
      Video.aggregate([
        {
          $match: {
            $or: [
              { category: { $regex: keyword, $options: "$i" } },
              { title: { $regex: keyword, $options: "$i" } },
              { tags: { $elemMatch: { $regex: keyword, $options: "$i" } } },
              {
                custom_tags: { $elemMatch: { $regex: keyword, $options: "$i" } }
              }
            ]
          }
        },
        { $sort: { [sortBy]: finalOrder, _id: finalOrder } },
        {
          $match: {
            $or: [
              { [sortBy]: separator, _id: { [comparator]: ObjectId(id) } },
              { [sortBy]: { [comparator]: separator } }
            ]
          }
        }
      ])
        .collation({ locale: "en" })
        .limit(1)
        .exec((err, video) => {
          const ret = { status: 200 };
          ret.result = video[0];
          if (ret.result) {
            console.log("============");
            console.log(ret.result.title);
            console.log("============");
          }
          res.status(ret.status).json(ret);
        });
    });
  },

  getYoutubeTags: (req, res) => {
    const id = req.query.id;
    Video.findOne({ youtube_id: id }, { tags: 1 }).exec((err, video) => {
      const ret = { status: 200 };
      ret.result = video;
      res.status(ret.status).json(ret);
    });
  },

  updateCustomTags: (req, res) => {
    const id = req.body.id;
    const tags = req.body.tags;
    const customTags = [];
    tags.forEach(tag => {
      customTags.push(tag.id.toLowerCase());
    });
    Video.findOneAndUpdate(
      { youtube_id: id },
      { $addToSet: { custom_tags: { $each: customTags } } },
      { new: true }
    ).exec((err, ac) => {
      const ret = { status: 200 };
      ret.result = {};
      res.status(ret.status).json(ret);
    });
  },

  updateYoutubeId: (req, res) => {
    const id = req.body.id;
    const youtubeId = req.body.youtube_id;
    request.get(
      `${conf.youTubeApiUrl}/videos?id=${youtubeId}&part=contentDetails,snippet,statistics&forUsername=iamOTHER&key=${conf.youTubeApiKey}`,
      function optionalCallback(err, response, body) {
        if (!err) {
          const jsonObj = JSON.parse(body);
          if (jsonObj.items.length > 0) {
            const title = jsonObj.items[0].snippet.title;
            const description = jsonObj.items[0].snippet.description;
            const duration = convertISO8601ToSeconds(
              jsonObj.items[0].contentDetails.duration
            );
            const tags = jsonObj.items[0].snippet.tags || [];
            const categoryId = jsonObj.items[0].snippet.categoryId;
            request.get(
              `${conf.youTubeApiUrl}/videoCategories?id=${categoryId}&part=snippet&forUsername=iamOTHER&key=${conf.youTubeApiKey}`,
              function optionalCallback(err, response, body) {
                const jsonObj = JSON.parse(body);
                let category = "";
                for (var i = 0; i < jsonObj.items.length; ++i) {
                  if (i > 0) {
                    category += ",";
                  }
                  category += jsonObj.items[i].snippet.title;
                }
                const toUpdate = {
                  youtube_id: youtubeId,
                  title: title,
                  description: description,
                  tags: tags,
                  category_id: categoryId,
                  category: category,
                  duration: duration,
                  youtube_status: "available"
                };
                Video.findOneAndUpdate(
                  { _id: id },
                  { $set: toUpdate },
                  { new: true }
                ).exec();
              }
            );
          } else {
            const toUpdate = {
              youtube_id: youtubeId,
              youtube_status: "unavailable"
            };
            Video.findOneAndUpdate(
              { _id: id },
              { $set: toUpdate },
              { new: true }
            ).exec();
          }
        }
        const ret = { status: 200 };
        ret.result = {};
        res.status(ret.status).json(ret);
      }
    );
  },

  // update tags, category_id, category, youtube_status, duration for each video
  // use a different youtube api key to avoid daliy limit
  updateYoutubeInfoCards: (req, res) => {
    const youTubeApiKey = "AIzaSyBaJHiKgT4KW58WJ26tH4PIIQE6vbOvU8w"; // google cloud project: youdescribeadm@gmail.com -> youdescribe-0616
    const Model = req.query.type == "Videos" ? Video : WishList;
    Model.find({
      $or: [{ youtube_status: "" }, { youtube_status: { $exists: false } }]
    })
      .limit(1000)
      .exec((err, videos) => {
        videos.forEach(video => {
          request.get(
            `${conf.youTubeApiUrl}/videos?id=${video.youtube_id}&part=contentDetails,snippet,statistics&forUsername=iamOTHER&key=${youTubeApiKey}`,
            function optionalCallback(err, response, body) {
              if (!err) {
                const jsonObj = JSON.parse(body);
                if (jsonObj.items.length > 0) {
                  const duration = convertISO8601ToSeconds(
                    jsonObj.items[0].contentDetails.duration
                  );
                  const tags = jsonObj.items[0].snippet.tags || [];
                  const categoryId = jsonObj.items[0].snippet.categoryId;
                  request.get(
                    `${conf.youTubeApiUrl}/videoCategories?id=${categoryId}&part=snippet&forUsername=iamOTHER&key=${youTubeApiKey}`,
                    function optionalCallback(err, response, body) {
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
                        youtube_status: "available"
                      };
                      Model.findOneAndUpdate(
                        { youtube_id: video.youtube_id },
                        { $set: toUpdate },
                        { new: true }
                      ).exec((err, ac) => {
                        console.log(video.youtube_id + "; available");
                      });
                    }
                  );
                } else {
                  const toUpdate = {
                    youtube_status: "unavailable"
                  };
                  Model.findOneAndUpdate(
                    { youtube_id: video.youtube_id },
                    { $set: toUpdate },
                    { new: true }
                  ).exec((err, ac) => {
                    console.log(video.youtube_id + "; unavailable");
                  });
                }
              }
            }
          );
          msleep(10);
        });
        res.end("done");
      });
  },

  searchByKeyword: (req, res) => {
    const keyword = req.query.keyword;
    Video.aggregate([
      {
        $match: {
          $or: [
            { category: { $regex: keyword, $options: "$i" } },
            { title: { $regex: keyword, $options: "$i" } },
            { tags: { $elemMatch: { $regex: keyword, $options: "$i" } } }
          ]
        }
      }
    ])
      .sort({ created_at: -1, _id: -1 })
      .exec((err, videos) => {
        const ret = { status: 200 };
        ret.result = videos;
        res.status(ret.status).json(ret);
      });
  },

  getYoutubeDataFromCache: (req, res) => {
    const youtubeIds = req.query.youtubeids;
    const key = req.query.key;
    const youtubeIdsCacheKey = key + "YoutubeIds";
    const youtubeDataCacheKey = key + "YoutubeData";
    if (youtubeIds == cache.get(youtubeIdsCacheKey)) {
      console.log(`loading ${key} from cache`);
      const ret = { status: 200 };
      ret.result = cache.get(youtubeDataCacheKey);
      res.status(ret.status).json(ret);
    } else {
      cache.put(youtubeIdsCacheKey, youtubeIds);
      request.get(
        `${conf.youTubeApiUrl}/videos?id=${youtubeIds}&part=contentDetails,snippet,statistics&key=${conf.youTubeApiKey}`,
        function optionalCallback(err, response, body) {
          console.log(`loading ${key} from youtube`);
          numOfVideosFromYoutube += youtubeIds.split(",").length;
          cache.put(youtubeDataCacheKey, body);
          const ret = { status: 200 };
          ret.result = body;
          res.status(ret.status).json(ret);
        }
      );
    }
  }
};

module.exports = videosController;
