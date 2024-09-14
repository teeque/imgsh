const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const codeSchema = new mongoose.Schema({
    data: String,
    shorturl: String,
    uploaderIP: String,
    secure: {
        type: Boolean,
        default: false,
    },
    pwd: String,
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now(),
    },
    expireDate: {
        type: Date,
        default: () => Date.now(),
    },
})

codeSchema.pre("save", async function (next) {
    if (this.isModified("pwd")) {
        const salt = await bcrypt.genSalt(10)
        this.pwd = await bcrypt.hash(this.pwd, salt)
    }
    next()
})

module.exports = mongoose.model("Code", codeSchema)
