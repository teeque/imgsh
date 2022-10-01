const mongoose = require('mongoose');
const fs = require('fs');

const imageSchema = new mongoose.Schema({
    filename: String,
    origName: String,
    filesize: Number,
    hits: {
        type: Number,
        default: 0
    },
    uploaderIP: String,
    shorturl: String,
    path: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
    lasthit: {
        type: Date,
        default: () => Date.now()
    }
})

imageSchema.pre('save', function(next){
    this.lasthit = Date.now();
    next();
})

imageSchema.post('remove', function(doc){
    fs.unlinkSync(this.path);
    console.log('del');
})

module.exports = mongoose.model('Image', imageSchema);