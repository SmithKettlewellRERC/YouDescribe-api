// #########################################
// RESPONSE CODES MESSAGES.
// #########################################
// # 1-49   = System messages.
// # 50-999 = Application error messages.
// # 1000-N = Application success messages.
// #########################################

module.exports = {
  RESPONSE_CODES_MESSAGES: {
    1: {
      message: 'Internal server error',
      status: 500,
      type: 'system_error',
    },
    2: {
      message: 'Unauthorized',
      status: 401,
      type: 'system_error',
    },
    3: {
      message: 'Forbidden',
      status: 403,
      type: 'system_error',
    },
    4: {
      message: 'Not found',
      status: 404,
      type: 'system_error',
    },
    50: { // wishListController
      message: 'The requested video already has audio description',
      status: 400,
      type: 'error',
    },
    51: { // wishListController
      message: 'The requested video is already in the wish list',
      status: 400,
      type: 'error',
    },

    52: {
      message: '',
      status: 400,
      type: 'error',
    },
    1000: { // videoController
      message: 'Video metadata successfully retrieved',
      status: 200,
      type: 'success',
    },
    1001: { // wishListController
      message: 'Wish list item was saved successfully',
      status: 200,
      type: 'success',
    },
  },

  getResponseByCode: function(code) {
    const content = this.RESPONSE_CODES_MESSAGES[code];
    const type = content.type;
    const ret = {
      type,
      code,
      status: this.RESPONSE_CODES_MESSAGES[code].status,
      message: this.RESPONSE_CODES_MESSAGES[code].message,
    };
    if (type === 'success') {
      ret.result = null;
    }
    return ret;
  },
};
