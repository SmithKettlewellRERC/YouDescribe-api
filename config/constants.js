module.exports = {
  RESPONSE_ERROR_DATA_NOT_FOUND: {
    status: 400,
    message: 'Not found',
    type: 'error',
    requested_id: null
  },
  RESPONSE_ERROR_INTERNAL_SERVER_ERROR: {
    status: 500,
    message: 'Internal server error',
    type: 'error',
  },
  RESPONSE_SUCCESS_WITH_DATA: {
    status: 200,
    message: 'Data successfull retrieved',
    type: 'success',
    data: null,
  }
};

// Everything worked
// The application did something wrong
// The API did something wrong

// Start by using the following 3 codes. If you need more, add them. But you shouldn't go beyond 8.

// 200 - OK
// 404 - Not Found
// 500 - Internal Server Error
// If you're not comfortable reducing all your error conditions to these 3, try picking among these additional 5:

// 201 - Created
// 304 - Not Modified
// 400 - Bad Request
// 401 - Unauthorized
// 403 - Forbidden

// Use three simple, common response codes indicating (1) success, (2) failure due to client-side problem, (3) failure due to server-side problem:

// 400 - Bad request
// 401 - Unauthorized
// 403 - Forbidden
// 404 - Not Found

// '{ "status" : 400, "developerMessage" : "Verbose, plain language description of the problem. Provide developers suggestions about how to solve their problems here", "userMessage" : "This is a message that can be passed along to end-users, if needed.", "errorCode" : "444444", "moreInfo" : "http://www.example.gov/developer/path/to/help/for/444444, http://tests.org/node/444444", }'