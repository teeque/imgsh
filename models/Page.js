const mongoose = require('mongoose');
const pageSchema = new mongoose.Schema({
    Pageviews: Number,
    Posthits: Number,
    Imgviews: Number
})

module.exports = mongoose.model('Page', pageSchema);