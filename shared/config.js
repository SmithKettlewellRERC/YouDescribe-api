const path = require('path');
const NODE_ENV = process.env.NODE_ENV;

module.exports = () => {
  const apiVersion = 'v1';
  let uploadsRootDirToServe = path.join(__dirname, '..', '/audio-descriptions-files');
  let uploadsRootDirToSave = path.join(__dirname, '..', 'audio-descriptions-files', 'current');
  let uploadsRootDirToDelete = path.join(__dirname, '..', 'audio-descriptions-files');
  if (NODE_ENV === 'prd') {
    uploadsRootDirToServe = '/mnt/ebs/audio-descriptions-files';
    uploadsRootDirToSave = '/mnt/ebs/audio-descriptions-files/current';
    uploadsRootDirToDelete = '/mnt/ebs/audio-descriptions-files';
  }
  const googleClientId = '1056671841574-e1r4soednlur8hl2sl0ooumpvftt1s2k.apps.googleusercontent.com';
  const googleiOSClientId = '1056671841574-5qo81vnn336mlds8mjk33cpkron1pv80.apps.googleusercontent.com';
  const cryptoSecret = '8c628449c5102aeabd49b5dc3a2a516ea6';
  const cryptoSeed = '#@2$d32467ERvdd';
  return {
    apiVersion,
    uploadsRootDirToServe,
    uploadsRootDirToSave,
    uploadsRootDirToDelete,
    cryptoSeed,
    cryptoSecret,
    googleClientId,
    googleiOSClientId,
  };
};
