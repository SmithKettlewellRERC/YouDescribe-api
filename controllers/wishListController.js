// Application modules.
const apiMessages = require('./../shared/apiMessages');
const nowUtc = require('./../shared/dateTime').nowUtc;
const Video = require('./../models/video');
const WishList = require('./../models/wishList');

// The controller itself.
const wishListController = {

  addOne: (req, res) => {
    const id = req.body.id;

    // Let's first search on videos collection.
    Video.findOne({ _id: id }, (err1, video) => {
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
        WishList.findOne({ _id: id }, (err2, wishListItem) => {

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
            .catch((errSave) => {
              console.log(errSave);
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
              return;
            });
            const ret = apiMessages.getResponseByCode(51);
            res.status(ret.status).json(ret);
          } else {
            // Let's create.
            const wishListReq = {
              _id: id,
              title: req.body.title,
              votes: 0,
              status: 'queued',
              created_at: nowUtc(),
              updated_at: nowUtc(),
            };

            const newWishList = new WishList(wishListReq);
            newWishList.save()

            .then((newWishListSaved) => {
              const ret = apiMessages.getResponseByCode(1001);
              ret.result = newWishListSaved;
              res.status(ret.status).json(ret);
              return;
            })
            .catch((err3) => {
              console.log(err3);
              const ret = apiMessages.getResponseByCode(1);
              res.status(ret.status).json(ret);
              return;
            });
          }
        });
      }
      return;
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

  getAll: (req, res) => {
    WishList.find({ status: 'queued' }).limit(30)
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
};

module.exports = wishListController;
