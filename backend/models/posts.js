const mongoose = require('mongoose')

const postsSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true,
        default: "Funny"
    },
    imgSrc: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        required: true,
        default: Date.now
    },
    likes: {
        type: Number,
        required: true,
        default: 0
    },
    dislikes: {
        type: Number,
        required: true,
        default: 0
    },
    nextLikeMilestone: {
        type: Number,
        required: true,
        default: 1
    }
})

module.exports = mongoose.model('posts', postsSchema)