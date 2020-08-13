const express = require("express");
const statisticsController = require("../controllers/statisticsController");
const router = express.Router();
const adminTokenValidator = require("./../middlewares/adminTokenValidator");

router.get(
  "/getcountofdatarecords",
  adminTokenValidator,
  statisticsController.getCountOfDataRecords
);
router.get(
  "/getaudioclipsofdescriptions",
  adminTokenValidator,
  statisticsController.getAudioClipsOfDescriptions
);
router.get(
  "/gettimelengthofaudioclips",
  adminTokenValidator,
  statisticsController.getTimeLengthOfAudioClips
);
router.get(
  "/getcategories",
  adminTokenValidator,
  statisticsController.getCategories
);
router.get(
  "/getwordcountofaudioclips",
  adminTokenValidator,
  statisticsController.getWordCountOfAudioClips
);
router.get(
  "/getwordcloudofaudioclips",
  statisticsController.getWordCloudOfAudioClips
);
router.get(
  "/getcategoriesofvideos",
  adminTokenValidator,
  statisticsController.getCategoriesOfVideos
);
router.get(
  "/gettagsofvideos",
  adminTokenValidator,
  statisticsController.getTagsOfVideos
);
router.get(
  "/getcountofvisits",
  adminTokenValidator,
  statisticsController.getCountOfVisits
);
router.get(
  "/getcountofaudioclips",
  adminTokenValidator,
  statisticsController.getCountOfAudioClips
);
router.get(
  "/getcountofaudiodescriptions",
  adminTokenValidator,
  statisticsController.getCountOfAudioDescriptions
);
router.get(
  "/getcountofvideos",
  adminTokenValidator,
  statisticsController.getCountOfVideos
);
router.get(
  "/getcountofwords",
  adminTokenValidator,
  statisticsController.getCountOfWords
);
router.get(
  "/getcountoffeedbacks",
  adminTokenValidator,
  statisticsController.getCountOfFeedbacks
);
router.get(
  "/getcountofusers",
  adminTokenValidator,
  statisticsController.getCountOfUsers
);
router.get(
  "/getdailycountofdatarecords",
  adminTokenValidator,
  statisticsController.getDailyCountOfDataRecords
);
router.get(
  "/getdailycountofwords",
  adminTokenValidator,
  statisticsController.getDailyCountOfWords
);
router.get("/syncaudioclips", statisticsController.syncAudioClips);
router.get("/synctranscriptions", statisticsController.syncTranscriptions);
router.get("/syncvideos", statisticsController.syncVideos);
router.get("/syncwishlist", statisticsController.syncWishList);
router.get("/syncwords", statisticsController.syncWords);
router.get("/syncusers", statisticsController.syncUsers);
router.get("/synccategories", statisticsController.syncCategories);

module.exports = router;
