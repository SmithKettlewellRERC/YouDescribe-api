const path = require('path');
// const NODE_ENV = process.env.NODE_ENV;
const NODE_ENV = "prd";

module.exports = () => {
  const apiVersion = 'v1';
  let uploadsRootDirToServe = path.join(__dirname, '..', '/audio-descriptions-files');
  let uploadsRootDirToSave = path.join(__dirname, '..', 'audio-descriptions-files', 'current');
  let uploadsRootDirToSaveAI = path.join(__dirname, "..", "audio-descriptions-files", "ai");
  let uploadsRootDirToDelete = path.join(__dirname, '..', 'audio-descriptions-files');
  if (NODE_ENV === 'prd') {
    uploadsRootDirToServe = '/mnt/ebs/audio-descriptions-files';
    uploadsRootDirToSave = '/mnt/ebs/audio-descriptions-files/current';
    uploadsRootDirToSaveAI = "/mnt/ebs/audio-descriptions-files/ai";
    uploadsRootDirToDelete = '/mnt/ebs/audio-descriptions-files';
  }
  const googleClientId = '1056671841574-e1r4soednlur8hl2sl0ooumpvftt1s2k.apps.googleusercontent.com';
  const googleiOSClientId = '1056671841574-5qo81vnn336mlds8mjk33cpkron1pv80.apps.googleusercontent.com';
  const googleAndroidClientId = '460424020444-9fn04ktboesvvbd3p99mdc2tn5759nb0.apps.googleusercontent.com';
  const cryptoSecret = '8c628449c5102aeabd49b5dc3a2a516ea6';
  const cryptoSeed = '#@2$d32467ERvdd';
  const listenByCodeAppKey = "yAOzHAy9LQBJQGtshcIGJX368IbC4Enx";
  const youTubeApiUrl = 'https://www.googleapis.com/youtube/v3';
  // const youTubeApiKey = 'AIzaSyCG7xsho1pmQavWYYglY9E2VILAnOGsZls';
  // const youTubeApiKey = "AIzaSyCEMAn_7h1wgIgZ4xhLbQUDuLKlkmvgLHs";  // fall 2019 in personal gmail account
  // const youTubeApiKey = "AIzaSyBQFD0fJoEO2l8g0OIrqbtjj2qXXVNO__U";  // project youdescribe-0127 in youdescribeadm@gmail.com
  const youTubeApiKey = "AIzaSyDV8QMir3NE8S2jA1GyXvLXyTuSq72FPyE";  // project youdescribe-0126 in youdescribeadm@gmail.com
  const googleCloudStorageKeyFilename = "shared/youdescribe-stats-846041efde0c.json";
  const googleCloudStorageProjectId = "youdescribe-stat-1569864136126";

  const jsonWebTokenSecret = "youdescribe"
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
    youTubeApiKey,
    googleCloudStorageProjectId,
    googleCloudStorageKeyFilename,
    jsonWebTokenSecret,
    nodeMailerAuthUser,
    nodeMailerAuthPass,
  };
};
