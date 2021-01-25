const conf = require("../shared/config")();
const nowUtc = require("../shared/helperFunctions").nowUtc;
const weeklyStatistics = require("./helpers/weeklyStatistics");

const utcToLongInt = require("../shared/helperFunctions").utcToLongInt;
const VideoOld = require("../models/videoOld");
const AudioClipOld = require("../models/audioClipOld");
const WishListOld = require("../models/wishListOld");
const Video = require("../models/video");
const User = require("../models/user");
const AudioDescription = require("../models/audioDescription");
const AudioDescriptionRating = require("../models/audioDescriptionRating");
const AudioClip = require("../models/audioClip");
const Transcription = require("../models/transcription");
const WishList = require("../models/wishList");
const Category = require("../models/category");
const Visit = require("../models/visit");
const request = require("request");
const WordPOS = require("wordpos");
const isJSON = require("./../shared/helperFunctions").isJSON;
const msleep = require("../shared/helperFunctions").msleep;
const convertISO8601ToSeconds = require("../shared/helperFunctions")
  .convertISO8601ToSeconds;
const fs = require("fs");
let cron = require("node-cron");
const transporter = conf.nodeMailerTransporter;
const cluster = require("cluster");

//weekly summary email

cron.schedule("45 14 * * 1", async () => {
  if (cluster.isMaster) {
    weeklyVideos = await weeklyStatistics.weeklyVideoCount();
    weeklyUsers = await weeklyStatistics.weeklyUserCount();
    weeklyWishlist = await weeklyStatistics.weeklyWishlistCount();

    let text = `This is an automated summary of YouDescribe statistics. In the last 7 days, there have been
              ${weeklyVideos.count} videos described. The average duration of these videos is ${weeklyVideos.avgduration} minutes. ${weeklyWishlist.count} videos have been added to the wishlist.
              \n 
              ${weeklyUsers.count} users have logged into YouDescribe in the last 7 days. 
              `;

    const emailList = ["jcastan6@mail.sfsu.edu"];
    const mailOptions = {
      from: conf.nodeMailerAuthUser,
      to: emailList,
      subject: "YouDescribe Weekly Summary",
      text: text
    };

    // Send e-mail
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
});

const statisticsController = {
  syncAudioClips: (req, res) => {
    AudioClipOld.find({}).exec((err, audioClips) => {
      audioClips.forEach(audioClip => {
        const toUpdate = {
          transcript: audioClip.transcript
        };
        AudioClip.findOneAndUpdate(
          { _id: audioClip._id },
          { $set: toUpdate },
          { new: true }
        ).exec((err, ac) => {
          console.log("audio clip successfully synchronized!!!");
        });
      });
      res.end("done");
    });
  },

  syncTranscriptions: (req, res) => {
    var cnt = 0;
    Transcription.find({})
      .populate({
        path: "audio_clip",
        populate: {
          path: "audio_description"
        }
      })
      .exec((err, transcriptions) => {
        transcriptions.forEach(transcription => {
          const toUpdate = {
            language: transcription.audio_clip.audio_description.language
          };
          Transcription.findOneAndUpdate(
            { _id: transcription._id },
            { $set: toUpdate },
            { new: true }
          ).exec((err, ac) => {
            console.log(++cnt + ":transcription successfully synchronized!!!");
          });
          res.end("done");
        });
      });
    // AudioClip.find({}).populate({
    //   path: "audio_description",
    // }).exec((err, audioClips) => {
    //   audioClips.forEach(audioClip => {
    //     Transcription.findOne({audio_clip: audioClip._id}).exec((err, transcription) => {
    //       if (!transcription && audioClip.audio_description) {
    //         let newTranscription = new Transcription({
    //           audio_clip: audioClip._id,
    //           order_id: "",
    //           status: "",
    //           created_at: nowUtc(),
    //           updated_at: nowUtc(),
    //           msg: "",
    //           rating: audioClip.audio_description.overall_rating_average,
    //         });
    //         newTranscription.save((err, transcription) => {
    //           console.log(++cnt + ":transcription successfully synchronized!!!");
    //         });
    //       }
    //     });
    //   });
    //   res.end("done");
    // });
  },

  syncVideos: (req, res) => {
    VideoOld.find({ youtube_status: { $ne: "" } }).exec((err, videos) => {
      videos.forEach(video => {
        let toUpdate = {};
        if (video.youtube_status == "available") {
          toUpdate = {
            tags: video.tags,
            category_id: video.category_id,
            category: video.category,
            youtube_status: video.youtube_status,
            duration: video.duration
          };
        } else if (video.youtube_status == "unavailable") {
          toUpdate = {
            youtube_status: video.youtube_status
          };
        }
        Video.findOneAndUpdate(
          { _id: video._id },
          { $set: toUpdate },
          { new: true }
        ).exec((err, ac) => {
          console.log("video successfully synchronized!!!");
        });
      });
      res.end("done");
    });
  },

  syncWishList: (req, res) => {
    WishListOld.find({ youtube_status: { $ne: "" } }).exec((err, videos) => {
      videos.forEach(video => {
        let toUpdate = {};
        if (video.youtube_status == "available") {
          toUpdate = {
            tags: video.tags,
            category_id: video.category_id,
            category: video.category,
            youtube_status: video.youtube_status,
            duration: video.duration
          };
        } else if (video.youtube_status == "unavailable") {
          toUpdate = {
            youtube_status: video.youtube_status
          };
        }
        WishList.findOneAndUpdate(
          { _id: video._id },
          { $set: toUpdate },
          { new: true }
        ).exec((err, ac) => {
          console.log("video successfully synchronized!!!");
        });
      });
      res.end("done");
    });
  },

  syncWords: (req, res) => {
    var cnt = 0;
    const wordpos = new WordPOS();
    Transcription.aggregate([
      {
        $lookup: {
          from: "audio_clips",
          localField: "audio_clip",
          foreignField: "_id",
          as: "audio_clip"
        }
      },
      { $unwind: "$audio_clip" },
      {
        $match: {
          language: /en/,
          "audio_clip.transcript": { $ne: [] },
          words: []
        }
      }
    ])
      .limit(10000)
      .exec((err, transcriptions) => {
        transcriptions.forEach(transcription => {
          const audioClip = transcription.audio_clip;
          const transcript = audioClip.transcript;
          var sentences = "";
          var length = 0;
          var words = [];
          var wordCloudArr = []; // this will be saved finally
          var wordCloudDict = {}; // this must be {} not [], as wordCloudDict[length] will cause problems
          transcript.forEach(item => {
            sentences += " " + item.sentence;
            length += item.sentence.split(" ").length - 1;
          });
          sentences = sentences
            .toLowerCase()
            .replace(/[']/g, " ")
            .replace(/[^a-z0-9\s+]/g, "");
          sentences.split(" ").forEach(item => {
            if (isNaN(wordCloudDict[item])) {
              wordCloudDict[item] = 1;
            } else {
              wordCloudDict[item]++;
            }
            delete wordCloudDict[""];
          });

          const promise = wordpos.getPOS(sentences);
          promise.then(function(pos) {
            words.push(...pos.nouns);
            words.push(...pos.adjectives);
            words.forEach(item => {
              if (!isNaN(wordCloudDict[item]) && isNaN(item)) {
                wordCloudArr.push({
                  key: item,
                  value: wordCloudDict[item]
                });
                delete wordCloudDict[item];
              }
            });
            // console.log(wordCloudArr);

            const toUpdate = {
              words: wordCloudArr,
              length: length
            };
            Transcription.findOneAndUpdate(
              { audio_clip: audioClip._id },
              { $set: toUpdate },
              { new: true }
            ).exec((err, transcription) => {
              console.log(
                ++cnt + ":transcription successfully synchronized!!!"
              );
            });
          });
        });
        res.end("done");
      });
  },

  syncUsers: (req, res) => {
    var cnt = 0;
    User.find({ created_at: { $exists: false } }).exec((err, users) => {
      users.forEach(user => {
        var created_at =
          user.updated_at && user.last_login
            ? Math.min(user.last_login, user.updated_at)
            : user.last_login || user.updated_at;
        User.findOneAndUpdate(
          { _id: user._id },
          { $set: { created_at: created_at } },
          { new: true }
        ).exec((err, ac) => {
          console.log(++cnt + ":user successfully synchronized!!!");
        });
      });
      res.end("done");
    });
  },

  syncCategories: (req, res) => {
    request.get(
      `${conf.youTubeApiUrl}/videoCategories?part=snippet&regionCode=us&forUsername=iamOTHER&key=${conf.youTubeApiKey}`,
      function optionalCallback(err, response, body) {
        const jsonObj = JSON.parse(body);
        const items = jsonObj.items;
        items.forEach(item => {
          new Category({
            category_id: item.id,
            title: item.snippet.title
          }).save();
        });
        res.end("done");
      }
    );
  },

  getCountOfDataRecords: (req, res) => {
    Video.countDocuments({}, (err, countOfVideos) => {
      AudioDescription.countDocuments({}, (err, countOfDescriptions) => {
        AudioClip.countDocuments(
          { transcript: { $ne: [] } },
          (err, countOfAudioClips) => {
            const ret = { status: 200 };
            ret.result = {
              countOfVideos: countOfVideos,
              countOfDescriptions: countOfDescriptions,
              countOfAudioClips: countOfAudioClips
            };
            res.status(ret.status).json(ret);
          }
        );
      });
    });
  },

  getAudioClipsOfDescriptions: (req, res) => {
    AudioDescription.find(
      { audio_clips: { $ne: [] } },
      { audio_clips: 1 }
    ).exec((err, audioDescriptions) => {
      const ret = { status: 200 };
      ret.result = audioDescriptions;
      res.status(ret.status).json(ret);
    });
  },

  getTimeLengthOfAudioClips: (req, res) => {
    AudioClip.find(
      { duration: { $gt: 0.5 }, transcript: { $ne: [] } },
      { duration: 1 }
    ).exec((err, audioClips) => {
      const ret = { status: 200 };
      ret.result = audioClips;
      res.status(ret.status).json(ret);
    });
  },

  getCategories: (req, res) => {
    Category.find({})
      .sort({ title: -1 })
      .exec((err, categories) => {
        const ret = { status: 200 };
        ret.result = categories;
        res.status(ret.status).json(ret);
      });
  },

  getCategoriesOfVideos: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    var wishListDescribedVideos = [];
    var wishListNotDescribedVideos = [];
    WishList.aggregate([
      {
        $match: {
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }
      },
      { $project: { status: 1, category: 1 } },
      {
        $match: {
          $and: [{ category: { $exists: true } }, { category: { $ne: "" } }]
        }
      }
    ]).exec((err, wishListVideos) => {
      wishListVideos.forEach(wishListVideo => {
        if (wishListVideo.status == "dequeued") {
          wishListDescribedVideos.push(wishListVideo);
        } else {
          wishListNotDescribedVideos.push(wishListVideo);
        }
      });
      Video.aggregate([
        {
          $match: {
            $and: [
              { created_at: { $gte: startDate } },
              { created_at: { $lt: endDate } }
            ]
          }
        },
        { $project: { category: 1 } },
        {
          $match: {
            $and: [{ category: { $exists: true } }, { category: { $ne: "" } }]
          }
        }
      ]).exec((err, videos) => {
        const ret = { status: 200 };
        ret.result = {
          describedVideos: videos,
          wishListDescribedVideos: wishListDescribedVideos,
          wishListNotDescribedVideos: wishListNotDescribedVideos
        };
        res.status(ret.status).json(ret);
      });
    });
  },

  getTagsOfVideos: (req, res) => {
    const category = req.query.category;
    const group = req.query.group;
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    if (group == "described") {
      Video.aggregate([
        {
          $match: {
            $and: [
              { created_at: { $gte: startDate } },
              { created_at: { $lt: endDate } }
            ]
          }
        },
        { $match: { category: category } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
        .limit(10)
        .exec((err, videos) => {
          const ret = { status: 200 };
          ret.result = videos;
          res.status(ret.status).json(ret);
        });
    } else {
      const status = group == "wishlist-described" ? "dequeued" : "queued";
      WishList.aggregate([
        {
          $match: {
            status: status,
            $and: [
              { created_at: { $gte: startDate } },
              { created_at: { $lt: endDate } }
            ]
          }
        },
        { $match: { category: category } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
        .limit(10)
        .exec((err, videos) => {
          const ret = { status: 200 };
          ret.result = videos;
          res.status(ret.status).json(ret);
        });
    }
  },

  getCountOfVisits: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    Visit.countDocuments(
      {
        youtube_id: { $ne: "" },
        $and: [
          { created_at: { $gte: startDate } },
          { created_at: { $lt: endDate } }
        ]
      },
      (err, countOfVideoVisits) => {
        Visit.find({
          //FIGURING OUT ERROR WITH IP TRACKING, WILL FIX LATER
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }).exec((err, countOfWebVisits) => {
          Visit.aggregate([
            {
              $match: {
                youtube_id: { $ne: "" },
                $and: [
                  { created_at: { $gte: startDate } },
                  { created_at: { $lt: endDate } }
                ]
              }
            },
            { $group: { _id: "$youtube_id", count: { $sum: 1 } } },
            {
              $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "youtube_id",
                as: "video"
              }
            },
            { $unwind: "$video" },
            { $sort: { count: -1 } }
          ])
            .limit(5)
            .exec((err, topVideos) => {
              const ret = { status: 200 };
              ret.result = {
                countOfVideoVisits,
                countOfWebVisits: countOfWebVisits.length || 0,
                topVideos
              };
              res.status(ret.status).json(ret);
            });
        });
      }
    );
  },

  getCountOfAudioClips: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    AudioClip.aggregate([
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
          duration: { $sum: "$duration" }
        }
      }
    ]).exec((err, audioClips) => {
      console.log(audioClips);
      const ret = { status: 200 };
      ret.result = {
        count: audioClips.length > 0 ? audioClips[0].count : 0,
        duration: audioClips.length > 0 ? audioClips[0].duration.toFixed(0) : 0
      };
      res.status(ret.status).json(ret);
    });
  },

  getCountOfAudioDescriptions: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    AudioDescription.aggregate([
      {
        $match: {
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }
      },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).exec((err, audioDescriptions) => {
      const ret = { status: 200 };
      ret.result = {
        count: audioDescriptions.length > 0 ? audioDescriptions[0].count : 0
      };
      res.status(ret.status).json(ret);
    });
  },

  getCountOfVideos: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    Video.aggregate([
      {
        $match: {
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }
      },
      // {$match: {"duration": {$gt: 0}}},
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          duration: { $sum: "$duration" }
        }
      }
    ]).exec((err, videos) => {
      const ret = { status: 200 };
      ret.result = {
        count: videos.length > 0 ? videos[0].count : 0,
        duration: videos.length > 0 ? videos[0].duration : 0
      };
      res.status(ret.status).json(ret);
    });
  },

  getCountOfWords: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    Transcription.aggregate([
      {
        $lookup: {
          from: "audio_clips",
          localField: "audio_clip",
          foreignField: "_id",
          as: "audio_clip"
        }
      },
      { $unwind: "$audio_clip" },
      {
        $match: {
          $and: [
            { "audio_clip.created_at": { $gte: startDate } },
            { "audio_clip.created_at": { $lt: endDate } }
          ]
        }
      },
      { $group: { _id: null, count: { $sum: "$length" } } }
    ]).exec((err, transcriptions) => {
      const ret = { status: 200 };
      ret.result = {
        count: transcriptions.length > 0 ? transcriptions[0].count : 0
      };
      res.status(ret.status).json(ret);
    });
  },

  getCountOfFeedbacks: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    AudioDescriptionRating.aggregate([
      {
        $match: {
          feedback: { $ne: [] },
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }
      },
      { $unwind: "$feedback" },
      { $group: { _id: "$feedback", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
      .limit(5)
      .exec((err, feedbacks) => {
        const ret = { status: 200 };
        ret.result = feedbacks;
        res.status(ret.status).json(ret);
      });
  },

  getCountOfUsers: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    User.countDocuments(
      {
        $or: [
          {
            $and: [
              { updated_at: { $gte: startDate } },
              { updated_at: { $lt: endDate } }
            ]
          },
          {
            $and: [
              { created_at: { $gte: startDate } },
              { created_at: { $lt: endDate } }
            ]
          }
        ]
      },
      (err, countOfUsers) => {
        const ret = { status: 200 };
        ret.result = countOfUsers;
        res.status(ret.status).json(ret);
      }
    );
  },

  getDailyCountOfDataRecords: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    const type = req.query.type;
    const comparator = type == "Web Visits" ? "$eq" : "$ne";
    let Model = new Object();
    if (type == "Users") {
      Model = User;
    } else if (type == "Audio Clips") {
      Model = AudioClip;
    } else if (type == "Audio Descriptions") {
      Model = AudioDescription;
    } else if (type == "Videos") {
      Model = Video;
    } else {
      Model = Visit;
    }
    Model.aggregate([
      {
        $match: {
          youtube_id: { [comparator]: "" },
          $and: [
            { created_at: { $gte: startDate } },
            { created_at: { $lt: endDate } }
          ]
        }
      },
      {
        $group: {
          _id: { $toLong: { $divide: ["$created_at", 1000000] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec((err, dailyOfDataRecords) => {
      const ret = { status: 200 };
      ret.result = dailyOfDataRecords;
      res.status(ret.status).json(ret);
    });
  },

  getDailyCountOfWords: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    Transcription.aggregate([
      {
        $lookup: {
          from: "audio_clips",
          localField: "audio_clip",
          foreignField: "_id",
          as: "audio_clip"
        }
      },
      { $unwind: "$audio_clip" },
      {
        $match: {
          $and: [
            { "audio_clip.created_at": { $gte: startDate } },
            { "audio_clip.created_at": { $lt: endDate } }
          ]
        }
      },
      {
        $group: {
          _id: { $toLong: { $divide: ["$audio_clip.created_at", 1000000] } },
          count: { $sum: "$length" }
        }
      },
      { $sort: { _id: 1 } }
    ]).exec((err, dailyOfWords) => {
      const ret = { status: 200 };
      ret.result = dailyOfWords;
      res.status(ret.status).json(ret);
    });
  },

  getWordCountOfAudioClips: (req, res) => {
    Transcription.find({ length: { $gt: 0 } }, { length: 1 }).exec(
      (err, transcriptions) => {
        const ret = { status: 200 };
        ret.result = transcriptions;
        res.status(ret.status).json(ret);
      }
    );
  },

  // https://stackoverflow.com/questions/27914953/mongodb-nested-object-aggregation-counting
  // https://stackoverflow.com/questions/35176641/mongo-group-with-project
  // https://www.npmjs.com/package/wordpos
  getWordCloudOfAudioClips: (req, res) => {
    const startDate = utcToLongInt(req.query.startdate);
    const endDate = utcToLongInt(req.query.enddate);
    const user = req.query.user;
    Transcription.aggregate([
      {
        $lookup: {
          from: "audio_clips",
          localField: "audio_clip",
          foreignField: "_id",
          as: "audio_clip"
        }
      },
      { $unwind: "$audio_clip" },
      {
        $lookup: {
          from: "users",
          localField: "audio_clip.user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $match: {
          language: /en/,
          "user.name": { $regex: user, $options: "$i" },
          $and: [
            { "audio_clip.created_at": { $gte: startDate } },
            { "audio_clip.created_at": { $lt: endDate } }
          ]
        }
      },
      { $unwind: "$words" },
      { $group: { _id: "$words.key", count: { $sum: "$words.value" } } },
      { $sort: { count: -1 } }
    ])
      .limit(150)
      .exec((err, words) => {
        if (req.query.download) {
          const ret = {
            startdate: parseInt(startDate / 1000000),
            enddate: parseInt(endDate / 1000000),
            user: user,
            words: words
          };
          fs.writeFile("wordcloud.json", JSON.stringify(ret), err => {
            res.download("wordcloud.json");
          });
        } else {
          const ret = { status: 200 };
          ret.result = words;
          res.status(ret.status).json(ret);
        }
      });
  }
};

module.exports = statisticsController;
