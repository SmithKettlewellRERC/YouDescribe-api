const express = require("express");
const multer = require("multer");
const audioClipsController = require("../controllers/audioClipsController");
const userTokenValidator = require("../middlewares/userTokenValidator");
const router = express.Router();
const upload = multer({ dest: "tmp/" });
const uploadWithSuffix = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "tmp/")
        },
        filename: function (req, file, cb) {
            const suffix = file.mimetype.split("/")[1];
            cb(null, file.fieldname + "_" + Date.now() + "." + suffix);
        }
    })
});

router.get("/", audioClipsController.getAllByPage);
router.get("/callback/:audioClipId", audioClipsController.speechToTextCallback);
router.get("/starttranscription", audioClipsController.startTranscription);
router.get("/gettranscriptionresult", audioClipsController.getTranscriptionResult);
router.post("/startspeechtotext", uploadWithSuffix.single("audiofile"), audioClipsController.startSpeechToText);
router.get("/getspeechtotextresult", audioClipsController.getSpeechToTextResult);
router.post("/addonebyai/:youtubeId", upload.single("audiofile"), audioClipsController.addOneByAI);

router.post("/:videoId", upload.single("wavfile"), userTokenValidator, audioClipsController.addOne);
router.delete("/:audioClipId", userTokenValidator, audioClipsController.delOne);
router.put("/:audioClipId", userTokenValidator, audioClipsController.updateOne);

module.exports = router;
