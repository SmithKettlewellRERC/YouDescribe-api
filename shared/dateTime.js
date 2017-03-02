const moment = require('moment');

module.exports = {
  nowUtc: () => {
    return moment().utc().format('YYYYMMDDHHmmss');
  },
};
