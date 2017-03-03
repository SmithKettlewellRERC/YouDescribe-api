// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');
const WishList = require('./../models/wishList');

// The controller itself.
const wishListController = {

  addOne: (req, res) => {
    const externalMediaId = req.body.externalMediaId;

    // Let's first search on videos collection.
    Video.findOne({ external_media_id: externalMediaId }, (err1, video) => {
      if (err1) {
        console.log(err1);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
      }

      // Video with AD already exists.
      if (video) {
        const ret = apiMessages.getResponseByCode(50);
        res.status(ret.status).json(ret);
      } else {
        // Let's now search at wishlist collection.
        WishList.findOne({ _id: externalMediaId }, (err2, wishListItem) => {

          // Error handling.
          if (err2) {
            console.log(err2);
            const ret = apiMessages.getResponseByCode(1);
            res.status(ret.status).json(ret);
          }

          // We already have in the database the video requested.
          if (wishListItem) {
            // Let's increment the requested cunter.
            wishListItem.request_counter += 1;
            wishListItem.save()
            .catch((errSave) => {
              console.log(errSave);
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            });
            const ret = apiMessages.getResponseByCode(51);
            res.status(ret.status).json(ret);
          } else {
            // Let's create.
            const wishListReq = {
              _id: externalMediaId,
              video_title: req.body.videoTitle,
              request_counter: 1,
              created_at: nowUtc(),
              updated_at: nowUtc(),
            };

            const newWishList = new WishList(wishListReq);

            newWishList.save()

            .then((newWishListSaved) => {
              const ret = apiMessages.getResponseByCode(1001);
              ret.result = newWishListSaved;
              res.status(ret.status).json(ret);
            })
            .catch((err3) => {
              console.log(err3);
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
            })
          }
        });
      }
    });
  },

  getOne: (req, res) => {
    const id = req.params.id;
    WishList.findOne({ _id: id })
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
};

module.exports = wishListController;
