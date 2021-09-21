const mongoose = require('mongoose')

const userPostsRelationSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    actionType: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    }
})

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    joined: {
        type: Date,
        required: true,
        default: Date.now
    },
    about: {
        type: String,
        required: true,
        default: "Write something about you!"
    },
    imgSrc: {
        type: String,
        required: true,
        default: "path"
    },
    postsLiked: [userPostsRelationSchema]
})

module.exports = mongoose.model('user', userSchema)