const path = require('path');
const NODE_ENV = process.env.NODE_ENV;

module.exports = () => {
  const apiVersion = 'v1';
  let uploadsRootDir = path.join(__dirname, '..', 'audio-descriptions-files', 'current');
  if (NODE_ENV === 'prd') {
    uploadsRootDir = '/mnt/ebs/audio-descriptions-files/current';
  }
  const googleClientId = '1056671841574-e1r4soednlur8hl2sl0ooumpvftt1s2k.apps.googleusercontent.com';
  const cryptoSecret = '8c628449c5102aeabd49b5dc3a2a516ea6';
  const cryptoSeed = '#@2$d32467ERvdd';
  return {
    apiVersion,
    uploadsRootDir,
    cryptoSeed,
    cryptoSecret,
    googleClientId,
  };
};
