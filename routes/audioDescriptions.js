const express = require("express");
const router = express.Router();
const audioDescriptionsController = require("../controllers/audioDescriptionsController");
const userTokenValidator = require("./../middlewares/userTokenValidator");
const adminTokenValidator = require("./../middlewares/adminTokenValidator");

router.get("/", audioDescriptionsController.getAllByPage)
router.get("/getallbypage", adminTokenValidator, audioDescriptionsController.getAllByPage)
router.get("/getbyid", adminTokenValidator, audioDescriptionsController.getById);
router.get("/getnext", adminTokenValidator, audioDescriptionsController.getNext);
router.get("/searchbykeyword", adminTokenValidator, audioDescriptionsController.searchByKeyword);
router.post("/updatestatus", adminTokenValidator, audioDescriptionsController.updateStatus);

router.post("/:videoId", userTokenValidator, audioDescriptionsController.createOne);
router.put("/:audioDescriptionId", userTokenValidator, audioDescriptionsController.updateAudioDescription);
router.delete("/:audioDescriptionId", userTokenValidator, audioDescriptionsController.deleteAudioDescription);

module.exports = router;
