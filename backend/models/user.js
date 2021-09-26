const mongoose = require('mongoose')

const userPostsLikeRelationSchema = new mongoose.Schema({
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

const userNotification = new mongoose.Schema({
    refId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    notificationType: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        required: true,
        default: false
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    }
})

const userPostsCreateRelationSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
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
    postsLiked: [userPostsLikeRelationSchema],
    postsCreated: [userPostsCreateRelationSchema],
    notifications: [userNotification]
})

module.exports = mongoose.model('user', userSchema)