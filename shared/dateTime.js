const moment = require('moment');

module.exports = {
  nowUtc: () => {
    return moment().utc().format('YYYYMMDDHHmmss');
  },
  utcToLongInt: (timestampUtc) => {
    return parseInt(moment(parseInt(timestampUtc)).format("YYYYMMDDHHmmss"));
  }
};
