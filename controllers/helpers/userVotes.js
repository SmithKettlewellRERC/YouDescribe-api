const nowUtc = require('./../../shared/dateTime').nowUtc;
const UserVotes = require('./../../models/userVotes');

module.exports = {
  add: (userId, youTubeId) => {
    const modelInstance = new UserVotes({
      youtube_id: youTubeId,
      user: userId,
      updated_at: nowUtc(),
      created_at: nowUtc(),    
    });
    return modelInstance.save();
  }
};
