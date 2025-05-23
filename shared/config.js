const fetch = require("node-fetch");
const path = require("path");
var moment = require("moment");
const NODE_ENV = process.env.NODE_ENV;
// const NODE_ENV = "prod";
const nodeMailer = require("nodemailer");
require("https").globalAgent.options.ca = require("ssl-root-cas").create();

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

  const passportRedirectUrl = "https://youdescribe.org";
  const passportCallbackUrl = "https://api.youdescribe.org/v1/auth/google/callback"



  if (NODE_ENV === "prod" || NODE_ENV === "dev") {
    uploadsRootDirToServe = "/mnt/ebs/audio-descriptions-files";
    uploadsRootDirToSave = "/mnt/ebs/audio-descriptions-files/current";
    uploadsRootDirToSaveAI = "/mnt/ebs/audio-descriptions-files/ai";
    uploadsRootDirToDelete = "/mnt/ebs/audio-descriptions-files";
  }
  const googleClientId =
    "1061361249208-9799kv6172rjgmk4gad077639dfrck82.apps.googleusercontent.com";

  const googleiOSClientIdOld = "1056671841574-5qo81vnn336mlds8mjk33cpkron1pv80.apps.googleusercontent.com";
  const googleiOSClientIdNew = "3158679793-l94a8t4asb14ar54ud9a93164sulh56l.apps.googleusercontent.com";
  const googleAndroidClientId =
    "3158679793-rlr3itj0rt0j36eqt2tcucaslvl19oob.apps.googleusercontent.com";
  const cryptoSecret = "8c628449c5102aeabd49b5dc3a2a516ea6";
  const cryptoSeed = "#@2$d32467ERvdd";
  const listenByCodeAppKey = "yAOzHAy9LQBJQGtshcIGJX368IbC4Enx";
  const youTubeApiUrl = "https://www.googleapis.com/youtube/v3";

  var youTubeApiKey = "AIzaSyAfU2tpVpMKmIyTlRljnKfPUFWXrNXg21Q";

  if(NODE_ENV == 'prod') {
    youTubeApiKey = "AIzaSyBQFD0fJoEO2l8g0OIrqbtjj2qXXVNO__U"
  } else if (NODE_ENV == 'dev') {
    youTubeApiKey = "AIzaSyDV8QMir3NE8S2jA1GyXvLXyTuSq72FPyE"
  }

  // const youTubeApiKey = "AIzaSyCEMAn_7h1wgIgZ4xhLbQUDuLKlkmvgLHs";     // !!! occupied by ios app !!! (google cloud project: youdescribesfsu@gmail.com -> youdescribe)
  // const youTubeApiKey = "AIzaSyDV8QMir3NE8S2jA1GyXvLXyTuSq72FPyE"; // !!! occupied by https://youdescribe.org !!! (google cloud project: youdescribeadm@gmail.com -> youdescribe-0126)
  // const youTubeApiKey = "AIzaSyBQFD0fJoEO2l8g0OIrqbtjj2qXXVNO__U";     // !!! occupied by https://dev.youdescribe.org !!! (google cloud project: youdescribeadm@gmail.com -> youdescribe-0127)
  //const youTubeApiKey = "AIzaSyBWQ2o3N0MVc8oP96JvWVVwqjxpEOgkhQU";     // !!! occupied by http://18.221.192.73:3001 !!! (google cloud project: youdescribeadm@gmail.com -> youdescribe-0612)
  //const youTubeApiKey = "AIzaSyAfU2tpVpMKmIyTlRljnKfPUFWXrNXg21Q";     // free to use (google cloud project: youdescribeadm@gmail.com -> youdescribe-0613)
  const googleCloudStorageKeyFilename =
    "shared/youdescribe-stats-846041efde0c.json";
  const googleCloudStorageProjectId = "youdescribe-stat-1569864136126";

  const jsonWebTokenSecret = "youdescribe";
  const nodeMailerAuthUser = "youdescribeadm@gmail.com";
  const nodeMailerAuthPass = "Youdescribe@123";

  const nodeMailerTransporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: nodeMailerAuthUser,
      clientId:
        "1061361249208-9799kv6172rjgmk4gad077639dfrck82.apps.googleusercontent.com",
      clientSecret: "emqt6gfCSMNlhHfpADZCEgqf",
      refreshToken:
        "1//04G0CRHoEeHbCCgYIARAAGAQSNwF-L9IrDLVaWgtTRx14lUgXKHIiiZLqTt_63ocFkF22VOCGXdkCrci56XYmPCmK19yo_Bhr64w",
      accessToken:
        "ya29.a0AfH6SMCl2PFRyEO_6KZi6-o4aJBGtz3aXDPPEmjIC1w3BmMfqSWZIl0tRgqvEzXhAbwCydclQNQa-5dY5BehpQICTz7ypprurpDGwmHZ9J2lD6clRVkpFrgoX-al4-TGmamhYACN78ZZ3WDMEgBDO-j_vc3n3MWbvwGq-2X_3tk",
    },
  });

  return {
    apiVersion,
    uploadsRootDirToServe,
    uploadsRootDirToSave,
    uploadsRootDirToSaveAI,
    uploadsRootDirToDelete,
    passportCallbackUrl,
    passportRedirectUrl,
    cryptoSeed,
    cryptoSecret,
    googleClientId,
    googleiOSClientIdOld,
    googleiOSClientIdNew,
    googleAndroidClientId,
    listenByCodeAppKey,
    youTubeApiUrl,
    youTubeApiKey: youTubeApiKey,
    googleCloudStorageProjectId,
    googleCloudStorageKeyFilename,
    jsonWebTokenSecret,
    nodeMailerAuthUser,
    nodeMailerAuthPass,
    nodeMailerTransporter,
  };
};
