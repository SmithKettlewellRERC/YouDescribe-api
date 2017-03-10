const path = require('path');

module.exports = () => {
  const apiVersion = 'v1';
  const uploadsRootDir = path.join(__dirname, '..', 'uploads', 'current');
  return {
    apiVersion,
    uploadsRootDir,
  };
};
