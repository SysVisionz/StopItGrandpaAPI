const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/stopitgramps');

const hashTag="your-hash-string"

export {mongoose, hashTag}