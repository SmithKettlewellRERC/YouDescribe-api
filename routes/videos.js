const express = require("express");
const router = express.Router();
const videosController = require("../controllers/videosController");
const userTokenValidator = require("./../middlewares/userTokenValidator");
const adminTokenValidator = require("./../middlewares/adminTokenValidator");
const webVisitCounter = require("./../middlewares/webVisitCounter");
const videoVisitCounter = require("./../middlewares/videoVisitCounter");

router.get("/", videoVisitCounter, videosController.getAll);
router.get(
  "/getyoutubedatafromcache",
  videosController.getYoutubeDataFromCache
);
router.get("/getallbypage", adminTokenValidator, videosController.getAllByPage);
router.get("/getbyid", adminTokenValidator, videosController.getById);
router.get("/getnext", adminTokenValidator, videosController.getNext);
router.get("/getyoutubetags", videosController.getYoutubeTags);
router.get("/updateyoutubeinfocards", videosController.updateYoutubeInfoCards);
router.post("/updatecustomtags", videosController.updateCustomTags);
router.post("/updateyoutubeid", videosController.updateYoutubeId);
router.get("/search", videosController.search);
router.get(
  "/searchbykeyword",
  adminTokenValidator,
  videosController.searchByKeyword
);
router.get("/addFromTestServer", videosController.addFromTestServer);
router.get("/:id", videosController.getOne);
router.get("/user/:userId", videosController.getVideosByUserId);

// router.post("/", videosController.addOne);
// router.put("/:id", videosController.updateOne);
// router.post("/:id", userTokenValidator, videosController.publish);

module.exports = router;
