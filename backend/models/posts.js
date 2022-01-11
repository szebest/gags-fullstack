const mongoose = require('mongoose')

const postCommentRelationSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    author: {
        type: String,
        requred: true
    },
    comment: {
        type: String,
        required: true
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
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    edited: {
        type: Boolean,
        required: false
    }
})

const postsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
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
    },
    edited: {
        type: Boolean,
        required: false
    },
    comments: [postCommentRelationSchema]
})

module.exports = mongoose.model('posts', postsSchema)