// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');
const WishList = require('./../models/wishList');

// The controller itself.
const wishListController = {

  addOne: (req, res) => {
    const youtube_id = req.body.id;

    // Let's first search on videos collection.
    Video.findOne({ youtube_id }, (err1, video) => {
      if (err1) {
        console.log(err1);
        const ret = apiMessages.getResponseByCode(1);
        res.status(ret.status).json(ret);
        return;
      }

      // Video with AD already exists.
      if (video) {
        const ret = apiMessages.getResponseByCode(50);
        res.status(ret.status).json(ret);
      } else {
        // Let's now search at wishlist collection.
        WishList.findOne({ youtube_id }, (err2, wishListItem) => {

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
              youtube_id,
              title: req.body.title,
              votes: 0,
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
              const ret = apiMessages.getResponseByCode(1001);
              ret.result = wishListItemSaved;
              res.status(ret.status).json(ret);
            })
          }
        });
      }
      return;
    });
  },

  getOne: (req, res) => {
    const youtube_id = req.params.id;
    WishList.findOne({ youtube_id })
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

  getAll: (req, res) => {
    // WishList.find({ status: 'queued' }).limit(30)
    WishList.find({ status: 'queued' })
    .sort({ votes: -1 })
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
    const youtube_id = req.params.id;

    WishList.findOneAndUpdate({ youtube_id }, { $set: { status: 'dequeued' } }, { new: true }, (err, wishList) => {
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
  }
};

module.exports = wishListController;
