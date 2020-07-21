const fetch = require("node-fetch");
const path = require("path");
// const NODE_ENV = process.env.NODE_ENV;
const NODE_ENV = "prd";
let currentApiKeyIndex = 0;

const youTubeApiKeys = [
  "AIzaSyBQFD0fJoEO2l8g0OIrqbtjj2qXXVNO__U",
  "AIzaSyAfU2tpVpMKmIyTlRljnKfPUFWXrNXg21Q"
];

// reset to first key at midnight, when all keys are reset.
var midnight = "0:00:00";
var now = null;
setInterval(function() {
  now = moment().format("H:mm:ss");
  if (now === midnight) {
    currentApiKeyIndex = 0;
  }
  $("#time").text(now);
}, 1000);

setInterval(function() {
  fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${youTubeApiKeys[currentApiKeyIndex]}`
  )
    .then(res => res.json())
    .then(result => {
      try {
        if (result.error.code === 403) {
          currentApiKeyIndex += 1;
          if (currentApiKeyIndex >= youTubeApiKeys.length) {
            currentApiKeyIndex = 0;
          }
          console.log(result);
          return false;
        }
      } catch (err) {
        console.log("api key works!");
      }
    });

  console.log(`API keys used: ${currentApiKeyIndex}\n\n`);
}, 20 * 1000);

module.exports = () => {
  const apiVersion = "v1";
  let uploadsRootDirToServe = path.join(
    __dirname,
    "..",
    "/audio-descriptions-files"
  );
  let uploadsRootDirToSave = path.join(
    __dirname,
    "..",
    "audio-descriptions-files",
    "current"
  );
  let uploadsRootDirToSaveAI = path.join(
    __dirname,
    "..",
    "audio-descriptions-files",
    "ai"
  );
  let uploadsRootDirToDelete = path.join(
    __dirname,
    "..",
    "audio-descriptions-files"
  );
  if (NODE_ENV === "prd") {
    uploadsRootDirToServe = "/mnt/ebs/audio-descriptions-files";
    uploadsRootDirToSave = "/mnt/ebs/audio-descriptions-files/current";
    uploadsRootDirToSaveAI = "/mnt/ebs/audio-descriptions-files/ai";
    uploadsRootDirToDelete = "/mnt/ebs/audio-descriptions-files";
  }
  const googleClientId =
    "1056671841574-e1r4soednlur8hl2sl0ooumpvftt1s2k.apps.googleusercontent.com";
  const googleiOSClientId =
    "1056671841574-5qo81vnn336mlds8mjk33cpkron1pv80.apps.googleusercontent.com";
  const googleAndroidClientId =
    "460424020444-9fn04ktboesvvbd3p99mdc2tn5759nb0.apps.googleusercontent.com";
  const cryptoSecret = "8c628449c5102aeabd49b5dc3a2a516ea6";
  const cryptoSeed = "#@2$d32467ERvdd";
  const listenByCodeAppKey = "yAOzHAy9LQBJQGtshcIGJX368IbC4Enx";
  const youTubeApiUrl = "https://www.googleapis.com/youtube/v3";
  // const youTubeApiKey = "AIzaSyCEMAn_7h1wgIgZ4xhLbQUDuLKlkmvgLHs";     // !!! occupied by ios app !!! (google cloud project: youdescribesfsu@gmail.com -> youdescribe)
  // const youTubeApiKey = "AIzaSyDV8QMir3NE8S2jA1GyXvLXyTuSq72FPyE";     // !!! occupied by https://youdescribe.org !!! (google cloud project: youdescribeadm@gmail.com -> youdescribe-0126)
  // const currentApiKey = "AIzaSyBQFD0fJoEO2l8g0OIrqbtjj2qXXVNO__U"; // !!! occupied by https://dev.youdescribe.org !!! (google cloud project: youdescribeadm@gmail.com -> youdescribe-0127)
  // const youTubeApiKey = "AIzaSyBWQ2o3N0MVc8oP96JvWVVwqjxpEOgkhQU";     // !!! occupied by http://18.221.192.73:3001 !!! (google cloud project: youdescribeadm@gmail.com -> youdescribe-0612)
  // const youTubeApiKey = "AIzaSyAfU2tpVpMKmIyTlRljnKfPUFWXrNXg21Q";     // free to use (google cloud project: youdescribeadm@gmail.com -> youdescribe-0613)

  const googleCloudStorageKeyFilename =
    "shared/youdescribe-stats-846041efde0c.json";
  const googleCloudStorageProjectId = "youdescribe-stat-1569864136126";

  const jsonWebTokenSecret = "youdescribe";
  const nodeMailerAuthUser = "youdescribeadm@gmail.com";
  const nodeMailerAuthPass = "Youdescribe@123";

  return {
    apiVersion,
    uploadsRootDirToServe,
    uploadsRootDirToSave,
    uploadsRootDirToSaveAI,
    uploadsRootDirToDelete,
    cryptoSeed,
    cryptoSecret,
    googleClientId,
    googleiOSClientId,
    googleAndroidClientId,
    listenByCodeAppKey,
    youTubeApiUrl,
    youTubeApiKey: youTubeApiKeys[currentApiKeyIndex],
    googleCloudStorageProjectId,
    googleCloudStorageKeyFilename,
    jsonWebTokenSecret,
    nodeMailerAuthUser,
    nodeMailerAuthPass
  };
};
