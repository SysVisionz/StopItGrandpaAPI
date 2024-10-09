const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/stopitgramps', {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

const hashTag="your-hash-string"

export {mongoose, hashTag}