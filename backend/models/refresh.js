const mongoose = require('mongoose')

const refreshSchema = new mongoose.Schema({
    refreshToken: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('refresh', refreshSchema)