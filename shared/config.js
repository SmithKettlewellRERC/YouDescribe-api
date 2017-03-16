const path = require('path');

module.exports = () => {
  const apiVersion = 'v1';
  const apiUrl = `http://localhost:8080/${apiVersion}`
  const uploadsRootDir = path.join(__dirname, '..', 'uploads', 'current');
  return {
    apiVersion,
    uploadsRootDir,
    apiUrl,
  };
};
