const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// const videoSchema = new Schema({ any: {} }, { collection: 'videos' });

const videoSchema = new Schema({
  _id: String,
  title: String,
  created_at: Number,
  updated_at: Number,
  views: Number,
  language: Number,
  rating: Number,
  status: String,
  audio_descriptions: {},
    // id: Number,
    // likes: Number,
    // author: Number,
    // clips: Schema.Types.Mixed,
  //   id: Number,
  //   old_id: Number,
  //   created_at: Number,
  //   updated_at: Number,
  //   title: String,
  //   downloads: Number,
  //   type: String,
  //   start_time: Number,
  //   end_time: Number,
  //   duration: Number,
  //   filename: String,
  notes: String,
}, { collection: 'videos' });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;


// animalSchema.statics.findByName = function(name, cb) {
//   return this.find({ name: new RegExp(name, 'i') }, cb);
// };

// var Animal = mongoose.model('Animal', animalSchema);
// Animal.findByName('fido', function(err, animals) {
//   console.log(animals);
// });
// animalSchema.query.byName = function(name) {
//   return this.find({ name: new RegExp(name, 'i') });
// };

// var Animal = mongoose.model('Animal', animalSchema);
// Animal.find().byName('fido').exec(function(err, animals) {
//   console.log(animals);
// });

// var studentSchema = new Schema({
//     name : {
//         type: String,
//         required : [true, '{PATH} is required'],
//         minlength: 10, // throw default error is <10
//         maxlength: [50, '{PATH} should be at max 50 chars long'],
//         match : [
//             new RegExp('^[a-z ]+$', 'i'), // allow alphabets
//             'Name should have alphabets and spaces'
//         ]
//     },
//     username : {
//         required : true,
//         trim : true,
//         lowercase : true,
 
//         type : String,
//         unique : true
//     },
//     gender: {
//         trim : true,
//         lowercase : true,
 
//         type : String,
//         //enum : ['male', 'female']
//         enum : {
//             values : ['male', 'female'],
//             message : '{PATH} with {VALUE} is not correct.'
//         }
 
//         default: 'male'
//     },
//     age : {
//         type : Number,
//         min : 18,
//         max : [100, 'You are too old.']
//     }
//     email : {
//         type : String,
//         required : true,
 
//         select : false
//     },
//     subjects : [String],
//     joined : Date,
//     batch : {
//         start: Date,
//         end : Date
//     }
// }, OPTIONS);