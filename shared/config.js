const path = require('path');

module.exports = () => {
  const apiVersion = 'v1';
  const apiUrl = `http://localhost:8080/${apiVersion}`
  const uploadsRootDir = path.join(__dirname, '..', 'uploads', 'current');
  const googleClientId = '1056671841574-e1r4soednlur8hl2sl0ooumpvftt1s2k.apps.googleusercontent.com';
  return {
    apiVersion,
    uploadsRootDir,
    apiUrl,
    googleClientId,
  };
};
