const mongoose = require('mongoose');
const codeSchema = new mongoose.Schema({
    data: String,
    shorturl: String,
    hits: {
        type: Number,
        default: 0
    },
    uploaderIP: String,
    secure: {
        type: Boolean,
        default: false
    },
    pwd: String,
    daysToSave: Number,
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

codeSchema.pre('save', function(next){
    this.lasthit = Date.now();
    next();
})

module.exports = mongoose.model('Code', codeSchema);