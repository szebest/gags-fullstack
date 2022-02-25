require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/user')
const Refresh = require('./models/refresh')
const Posts = require('./models/posts')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const multer = require('multer')
const upload = multer({
    limits: {
        fileSize: 3 * 1024 * 1024, // no larger than 3mb
    }
})
const sharp = require('sharp')
const { uploadFile } = require('./gcs')
const dnsPrefetchControl = require('dns-prefetch-control')

mongoose.connect(process.env.MONGODB_CONNECTION_URL)

const db = mongoose.connection

const sections = ['Funny', 'Wholesome', 'Awesome', 'Anime&Manga', 'NSFW', 'Animals', 'Random', 'WTF']

const postLikeMilestones = [1, 10, 50, 100, 200, 500, 1000]

const connectedUserSockets = []

db.on('error', (error) => console.error(error))
db.once('open', () => console.error('Connected to database'))

app.use(express.json())

app.use(cors())

app.use(express.urlencoded({ extended: true }))

app.use(dnsPrefetchControl({ allow: true }))

const PORT = process.env.PORT || 3001

app.get('/', (req, res) => {
    return res.send("Welcome to GAGS API")
})

app.post('/hasAccess', authenticateToken, (req, res) => {
    res.status(200).json({ access: true })
})

app.post('/login', async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    try {
        const users = await User.find({ username })
        if (users.length === 0)
            res.status(401).json({ message: "No user found" })
        else {
            const samePasswords = await bcrypt.compare(password, users[0].password)
            if (samePasswords) {
                const accessToken = jwt.sign({ username: users[0].username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.EXPIRES_IN })
                const refreshToken = jwt.sign({ username: users[0].username }, process.env.REFRESH_TOKEN_SECRET)

                const refresh = new Refresh({
                    refreshToken,
                    username
                })

                try {
                    await refresh.save()
                    res.status(201).json({ accessToken, refreshToken, expiresIn: process.env.EXPIRES_IN })
                }
                catch (err) {
                    res.status(400).json({ message: err.message })
                }
            }
            else
                res.status(401).json({ message: "Wrong password" })
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
})

app.post('/logout', async (req, res) => {
    const refreshToken = req.body.refreshToken

    try {
        const removed = await Refresh.deleteOne({ refreshToken })

        res.status(200).json({ deletedCount: removed.deletedCount })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: err })
    }
})

app.post('/refresh', async (req, res) => {
    const refreshToken = req.body.refreshToken
    if (refreshToken === null)
        return res.sendStatus(400)

    try {
        const refreshTokenValid = (await Refresh.find({ refreshToken })).length > 0

        if (!refreshTokenValid)
            res.sendStatus(400)
        else {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err)
                    return res.sendStatus(400)

                const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.EXPIRES_IN })

                res.status(200).json({ accessToken })
            })
        }
    }
    catch (err) {
        console.log(err)
        return res.sendStatus(403)
    }
})

app.post('/register', upload.single("file"), async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const username = req.body.username

    try {
        const users = await User.find({ username })
        if (users.length > 0) return res.status(409).json({ message: "A user with this login already exists" })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: err.message })
    }

    let imageResult = await sharp(req.file.buffer)
        .resize({ width: 100, height: 100 })
        .toFormat(req.file.mimetype.split('/')[1])
        .toBuffer()

    const fileSrc = await uploadFile(req.file.mimetype, req.file.originalname, imageResult.buffer, '1Rw43VHhxDzmpsY-CVfPeUjH1-ee5gyfh')

    const user = new User({
        username: username,
        password: hashedPassword,
        imgSrc: fileSrc,
        postsLiked: [],
        postsCreated: [],
        notifications: [],
        commentsLiked: []
    })

    try {
        const newUser = await user.save()
        return res.status(201).json(newUser)
    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ message: err.message })
    }
})

app.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    const username = req.username
    const file = req.file
    const section = req.body.section
    const title = req.body.title

    if (!sections.includes(section))
        return res.status(400)

    /*let imageBuffer = await sharp(req.file.buffer)
                            .resize({ width: 50, height: 50 })
                            .toFormat(req.file.mimetype.split('/')[1])
                            .toBuffer()*/

    const fileSrc = await uploadFile(file.mimetype, file.originalname, req.file.buffer, '1oDggHkUemf4ONbSk9SqKh4Lq1dPc5W-D')

    try {

        const user = await User.findOne({ username })

        const post = new Posts({
            userId: user._id,
            author: username,
            title,
            section,
            imgSrc: fileSrc,
            comments: []
        })

        const newPost = await post.save()

        user.postsCreated.unshift({})
        user.postsCreated[0].postId = newPost._id

        await User.findOneAndUpdate({ username }, user)

        return res.status(201).json(newPost)
    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ message: err.message })
    }
})

app.get('/sections', (req, res) => {
    res.status(200).send({ sections: sections })
})

app.get('/user/postsLiked/:username', checkToken, async (req, res) => {
    const firstPost = parseInt(req.query.postNumber)
    const amountOfReturnedPosts = parseInt(req.query.postsPerRequest)
    const username = req.params.username
    const usernameVisiting = req.username

    try {
        const user = (await User.findOne({ username }).lean())

        const userVisiting = usernameVisiting ? (await User.findOne({ username: usernameVisiting }).lean()) : undefined

        const userLikedPosts = user.postsLiked

        const slicedPosts = userLikedPosts.reverse().slice(firstPost, firstPost + amountOfReturnedPosts)

        const posts = []

        for (const slicedPost of slicedPosts) {
            if (slicedPost.actionType !== "none") {
                const post = await Posts.findById(slicedPost.postId).lean()

                if (userVisiting && userVisiting._id.toString() === post.userId.toString()) post.isAuthor = true

                if (userVisiting) {
                    for (const userVisitingLikedPost of userVisiting.postsLiked) {
                        if (post._id.toString() === userVisitingLikedPost.postId.toString()) {
                            post.actionType = userVisitingLikedPost.actionType
                        }
                    }
                }

                post.commentsAmount = post.comments.length
                delete post.comments

                posts.unshift(post)
            }
        }

        const numberOfPostsLeft = Math.max(userLikedPosts.length - firstPost - amountOfReturnedPosts, 0)

        return res.status(200).json({
            posts,
            numberOfPostsLeft
        })
    }
    catch (err) {
        console.log(err)
        return res.status(400)
    }
})

app.get('/user/postsCreated/:username', checkToken, async (req, res) => {
    const firstPost = parseInt(req.query.postNumber)
    const amountOfReturnedPosts = parseInt(req.query.postsPerRequest)
    const username = req.params.username
    const usernameVisiting = req.username

    try {
        const user = (await User.findOne({ username }).lean())

        const userVisiting = usernameVisiting ? (await User.findOne({ username: usernameVisiting }).lean()) : undefined

        const userCreatedPosts = user.postsCreated

        const slicedPosts = userCreatedPosts.reverse().slice(firstPost, firstPost + amountOfReturnedPosts)

        const posts = []

        for (const slicedPost of slicedPosts) {
            const post = await Posts.findById(slicedPost.postId).lean()

            if (userVisiting && userVisiting._id.toString() === post.userId.toString()) post.isAuthor = true

            if (userVisiting) {
                for (const userVisitingLikedPost of userVisiting.postsLiked) {
                    if (slicedPost.postId.toString() === userVisitingLikedPost.postId.toString()) {
                        post.actionType = userVisitingLikedPost.actionType
                    }
                }
            }

            post.commentsAmount = post.comments.length
            delete post.comments

            posts.unshift(post)
        }

        const numberOfPostsLeft = Math.max(userCreatedPosts.length - firstPost - amountOfReturnedPosts, 0)
        return res.status(200).json({
            posts,
            numberOfPostsLeft
        })
    }
    catch (err) {
        console.log(err)
        return res.status(400)
    }
})

app.get('/user/commentsCreated/:username', checkToken, async (req, res) => {
    const username = req.params.username
    const usernameVisiting = req.username

    try {
        const user = await User.findOne({ username })

        const userVisiting = usernameVisiting ? (await User.findOne({ username: usernameVisiting }).lean()) : undefined

        const postsWithUserAction = await Posts.find({ "comments.userId": user._id }).lean()

        const comments = []

        postsWithUserAction.reverse().forEach((postWithUserAction) => {
            postWithUserAction.comments.reverse().forEach((comment) => {
                if (comment.userId.toString() === user._id.toString()) {
                    comments.unshift(comment)
                    comments[0].postTitle = postWithUserAction.title

                    if (userVisiting) {
                        for (const userVisitingLikedComment of userVisiting.commentsLiked) {
                            if (comment._id.toString() === userVisitingLikedComment.commentId.toString()) {
                                comments[0].actionType = userVisitingLikedComment.actionType
                            }
                        }
                    }
                    if (userVisiting && userVisiting._id.toString() === user._id.toString()) comments[0].isAuthor = true
                }
            })
        })

        return res.status(200).json({ comments })
    }
    catch(err) {
        console.log(err)
        return res.status(400)
    }
})

app.get('/user/commentsLiked/:username', checkToken, async (req, res) => {
    const username = req.params.username
    const usernameVisiting = req.username

    try {
        const user = await User.findOne({ username })

        const userVisiting = usernameVisiting ? (await User.findOne({ username: usernameVisiting }).lean()) : undefined

        const comments = []

        for (const commentLiked of user.commentsLiked) {
            if (commentLiked.actionType !== "none") {
                const post = await Posts.findById(commentLiked.postId).lean()

                post.comments.forEach((comment) => {
                    if (comment._id.toString() === commentLiked.commentId.toString()) {
                        comments.unshift(comment)
                        comments[0].postTitle = post.title
                        if (userVisiting) {
                            for (const userVisitingLikedComment of userVisiting.commentsLiked) {
                                if (comment._id.toString() === userVisitingLikedComment.commentId.toString()) {
                                    comments[0].actionType = userVisitingLikedComment.actionType
                                }
                            }
                        }
                    }
                    if (userVisiting && comment.userId.toString() === userVisiting._id.toString()) {
                        comment.isAuthor = true
                    }
                })
            }
        }

        return res.status(200).json({ comments })
    }
    catch(err) {
        console.log(err)
        return res.status(400)
    }
})

app.patch('/user/notification/:id', authenticateToken, async (req, res) => {
    const notificationID = req.params.id
    const username = req.username
    const updatedRead = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined

    if (!updatedRead)
        return res.sendStatus(400)

    try {
        const foundUser = (await User.find({ username }).lean())[0]

        foundUser.notifications.forEach((notification, index) => {
            if (notification._id.toString() === notificationID.toString())
                foundUser.notifications[index].read = updatedRead
        })

        await User.findOneAndUpdate({ username }, foundUser)

        return res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get('/user/:username', checkToken, async (req, res) => {
    const username = req.username ?? req.params.username
    
    try {
        const user = await User.findOne({ username })

        if (user === null) return res.sendStatus(404)

        return res.status(200).send({ user })
    }
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get('/user/avatar/:username', async (req, res) => {
    const username = req.params.username

    try {
        const foundUser = (await User.find({ username }).lean())[0]

        return res.status(200).send({ imgSrc: foundUser.imgSrc })
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get('/posts', checkToken, async (req, res) => {
    const firstPost = parseInt(req.query.postNumber)
    const amountOfReturnedPosts = parseInt(req.query.postsPerRequest)
    const section = req.query.section
    const username = req.username

    try {
        const posts = section === 'undefined' ? await Posts.find().lean() : await Posts.find({ section }).lean()
        const user = await User.findOne({ username })
        const userLikedPosts = user ? user.postsLiked : []

        const slicedPosts = posts.reverse().slice(firstPost, firstPost + amountOfReturnedPosts).map((slicedPost) => {
            userLikedPosts.forEach((likedPost) => {
                if (likedPost.postId && likedPost.postId.toString() === slicedPost._id.toString())
                    slicedPost.actionType = likedPost.actionType
            })

            slicedPost.commentsAmount = slicedPost.comments.length
            delete slicedPost.comments

            if (user && user._id.toString() === slicedPost.userId.toString()) {
                slicedPost.isAuthor = true
            }

            return slicedPost
        })

        const numberOfPostsLeft = Math.max(posts.length - firstPost - amountOfReturnedPosts, 0)
        return res.status(200).json({
            posts: slicedPosts,
            numberOfPostsLeft
        })
    }
    catch (err) {
        console.log(err)
        return res.status(400)
    }
})

app.patch('/posts/:postID/comment/:commentID/edit', authenticateToken, async (req, res) => {
    const postID = req.params.postID
    const commentID = req.params.commentID
    const updatedCommentText = req.body.comment
    const username = req.username

    try {
        const postWithUpdatedComment = await Posts.findById(postID).lean()

        const user = await User.findOne({username})

        const commentIndex = postWithUpdatedComment.comments.findIndex((comment) => {
            return comment._id.toString() === mongoose.Types.ObjectId(commentID).toString()
        })

        if (postWithUpdatedComment.comments[commentIndex].userId.toString() !== user._id.toString()) {
            return res.status(400)
        }

        postWithUpdatedComment.comments[commentIndex].comment = updatedCommentText

        postWithUpdatedComment.comments[commentIndex].edited = true

        postWithUpdatedComment.comments[commentIndex].timestamp = Date.now()

        await Posts.findByIdAndUpdate(postID, postWithUpdatedComment)

        return res.status(200).json({ updatedComment: postWithUpdatedComment.comments[commentIndex] })
    }
    catch(err) {
        console.log(err)
        return res.status(400)
    }
})

app.patch('/posts/:postID/edit', authenticateToken, async (req, res) => {
    const postID = req.params.postID
    const updatedTitle = req.body.title
    const username = req.username

    try {
        const postToBeUpdated = await Posts.findById(postID).lean()

        if (postToBeUpdated.comments === null) {
            return res.status(404)
        }

        const user = await User.findOne({ username })

        if (postToBeUpdated.comments === null) {
            return res.status(404)
        }

        if (postToBeUpdated.userId.toString() !== user._id.toString()) {
            return res.status(400)
        }

        postToBeUpdated.title = updatedTitle

        postToBeUpdated.edited = true

        postToBeUpdated.created = Date.now()

        await Posts.findByIdAndUpdate(postID, postToBeUpdated)

        postToBeUpdated.isAuthor = true

        postToBeUpdated.commentsAmount = postToBeUpdated.comments.length

        delete postToBeUpdated.comments

        return res.status(200).json({ updatedPost: postToBeUpdated })
    }
    catch(err) {
        console.log(err)
        return res.status(400)
    }
})

app.post('/posts/:id/comment', authenticateToken, async (req, res) => {
    const postID = req.params.id
    const comment = req.body.comment
    const parentCommentID = req.body.parentComment ?? undefined
    const username = req.username

    try {
        const found = await Posts.findById(postID).lean()

        const foundUser = await User.findOne({ username })

        found.comments = found.comments ?? []
        found.comments.unshift({})
        found.comments[0].postID = postID
        //TODO: add children comments to the parent comment
        parentCommentID ? found.comments[0].parentCommentId = parentCommentID : ""
        found.comments[0].author = username
        found.comments[0].userId = foundUser._id
        found.comments[0].postId = postID
        found.comments[0].comment = comment
        found.comments[0].likes = 0
        found.comments[0].dislikes = 0

        const updatedPost = await Posts.findByIdAndUpdate(postID, found, { new: true }).lean()

        updatedPost.comments[0].isAuthor = true

        return res.status(200).send({ comment: updatedPost.comments[0] })
    }
    catch (err) {
        console.log(err)
        return res.sendStatus(400)
    }
})

app.delete('/posts/:postID', authenticateToken, async (req, res) => {
    const postID = req.params.postID
    const username = req.username

    try {
        const foundPost = await Posts.findById(postID).lean()

        if (foundPost === null) return res.status(400)

        const foundAuthor = await User.findOne({ username }).lean()

        if (foundAuthor._id.toString() !== foundPost.userId.toString()) return res.status(403)

        const allUsers = await User.find({}).lean()

        const comments = foundPost.comments

        await Posts.findByIdAndRemove(postID)

        allUsers.forEach(async (singleUser) => {
            comments.forEach((comment) => {
                const filteredCommentsLiked = singleUser.commentsLiked.filter((commentLiked) => {
                    return commentLiked.commentId.toString() !== comment._id.toString()
                })
                singleUser.commentsLiked = filteredCommentsLiked
            })

            const filteredCommentsLiked = singleUser.commentsLiked.filter((commentLiked) => {
                return !!(comments.find((comment) => {
                    return commentLiked.commentId.toString() !== comment._id.toString()
                }))
            })
            singleUser.commentsLiked = filteredCommentsLiked

            const filteredPostsLiked = singleUser.postsLiked.filter((postLiked) => {
                return postLiked.postId.toString() !== mongoose.Types.ObjectId(postID).toString()
            })

            singleUser.postsLiked = filteredPostsLiked

            const filteredPostsCreated = singleUser.postsLiked.filter((postCreated) => {
                return postCreated.postId.toString() !== mongoose.Types.ObjectId(postID).toString()
            })

            singleUser.postsCreated = filteredPostsCreated

            await User.findByIdAndUpdate(singleUser._id, singleUser)
        })

        return res.status(200).json({deleted: foundPost})
    }
    catch(err) {
        console.log(err)
        return res.status(400)
    }
})

app.delete('/posts/:postID/comment/:commentID', authenticateToken, async (req, res) => {
    const postID = req.params.postID
    const commentID = req.params.commentID
    const username = req.username

    try {
        const foundPost = await Posts.findById(postID).lean()

        const foundAuthor = await User.findOne({ username }).lean()

        const allUsers = await User.find({}).lean()

        const foundCommentIdToBeDeleted = foundPost.comments.findIndex((comment) => {
            return comment._id.toString() === mongoose.Types.ObjectId(commentID).toString()
        })

        if (foundCommentIdToBeDeleted < 0) return res.status(400)

        if (foundAuthor._id.toString() !== foundPost.comments[foundCommentIdToBeDeleted].userId.toString()) return res.status(403)

        const deleted = foundPost.comments.splice(foundCommentIdToBeDeleted, 1)

        await Posts.findByIdAndUpdate(postID, foundPost)

        allUsers.forEach(async (singleUser) => {
            const filtered = singleUser.commentsLiked.filter((commentLiked) => {
                return commentLiked.commentId.toString() !== mongoose.Types.ObjectId(commentID).toString()
            })
            singleUser.commentsLiked = filtered

            await User.findByIdAndUpdate(singleUser._id, singleUser)
        })

        return res.status(200).json({deleted: deleted[0]})
    }
    catch(err) {
        console.log(err)
        return res.status(400)
    }
})

app.patch('/posts/:postID/comment/:commentID/like', authenticateToken, async (req, res) => {
    const postID = req.params.postID
    const commentID = req.params.commentID
    const like = parseInt(req.body.like) || 0
    const dislike = parseInt(req.body.dislike) || 0
    const username = req.username

    if (((like === 1 && dislike === 1) || (like === -1 && dislike === -1))) return res.sendStatus(400)

    try {
        const foundPost = await Posts.findById(postID).lean()

        const foundUser = await User.findOne({ username }).lean()

        const foundCommentIndex = foundPost.comments.findIndex(comment => {
            return comment._id.toString() === mongoose.Types.ObjectId(commentID).toString()
        })

        let foundAlreadyLikedCommentIndex = foundUser.commentsLiked.findIndex((commentLiked) => {
            return commentLiked.commentId.toString() === foundPost.comments[foundCommentIndex]._id.toString()
        })

        if (foundAlreadyLikedCommentIndex !== -1) {
            const actionDid = foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType

            if (actionDid === 'like' && like === -1) {
                foundPost.comments[foundCommentIndex].likes += like
                if (dislike === 0) foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'none'
                else if (dislike === 1) {
                    foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'dislike'
                    foundPost.comments[foundCommentIndex].dislikes += dislike
                }
            }
            else if (actionDid === 'dislike' && dislike === -1) {
                foundPost.comments[foundCommentIndex].dislikes += dislike
                if (like === 0) foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'none'
                else if (like === 1) {
                    foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'like'
                    foundPost.comments[foundCommentIndex].likes += like
                }
            }
            else if (actionDid === 'none' && like === 1) {
                foundPost.comments[foundCommentIndex].likes += like
                foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'like'
            }
            else if (actionDid === 'none' && dislike === 1) {
                foundPost.comments[foundCommentIndex].dislikes += dislike
                foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'dislike'
            }
            else return res.status(400).json({
                badRequest: true,
                actionDid: foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType
            })
        }
        else {
            if (dislike < 0 || like < 0) return res.status(400)

            foundPost.comments[foundCommentIndex].likes += like
            foundPost.comments[foundCommentIndex].dislikes += dislike
        }

        if (foundPost.comments[foundCommentIndex].likes < 0) foundPost.comments[foundCommentIndex].likes = 0
        if (foundPost.comments[foundCommentIndex].dislikes < 0) foundPost.comments[foundCommentIndex].dislikes = 0

        if (foundAlreadyLikedCommentIndex < 0) {
            foundUser.commentsLiked.unshift({})
            foundAlreadyLikedCommentIndex = 0

            foundUser.commentsLiked[foundAlreadyLikedCommentIndex].commentId = foundPost.comments[foundCommentIndex]._id
            foundUser.commentsLiked[foundAlreadyLikedCommentIndex].postId = postID
        }

        foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = like === 1 ? 'like' :
            (dislike === 1 ? 'dislike' : 'none')

        await Posts.findByIdAndUpdate(postID, foundPost)

        await User.findOneAndUpdate({ username }, foundUser)

        return res.status(200).send({ updatedComment: foundPost.comments[foundCommentIndex] })
    }
    catch (err) {
        console.log(err)
        return res.sendStatus(400)
    }
})

app.get('/posts/:id', checkToken, async (req, res) => {
    const postID = req.params.id
    const username = req.username

    try {
        const found = await Posts.findById(postID).lean()

        if (username !== undefined) {
            const user = await User.findOne({username})

            const foundUserIndex = user.postsLiked.findIndex((postLiked) => {
                return postLiked.postId && postLiked.postId.toString() === mongoose.Types.ObjectId(postID).toString()
            })

            if (user && user._id.toString() === found.userId.toString()) {
                found.isAuthor = true
            }

            if (foundUserIndex >= 0) found.actionType = user.postsLiked[foundUserIndex].actionType
        }

        found.commentsAmount = found.comments.length

        delete found.comments

        return res.status(200).json({ post: found })
    }
    catch (err) {
        console.log(err)
        return res.sendStatus(400)
    }
})

app.get('/posts/:id/comment', checkToken, async (req, res) => {
    const postID = req.params.id
    const username = req.username

    try {
        const found = await Posts.findById(postID).lean()
        if (username) {
            const foundUser = await User.findOne({ username })

            found.comments.map((comment) => {
                const foundIndex = foundUser.commentsLiked.findIndex((commentLiked) => {
                    return commentLiked.commentId.toString() === comment._id.toString()
                })
                if (foundIndex !== -1) {
                    comment.actionType = foundUser.commentsLiked[foundIndex].actionType
                }
                if (comment.userId.toString() === foundUser._id.toString()) {
                    comment.isAuthor = true
                }
                return comment
            })
        }

        return res.status(200).json({ comments: found.comments })
    }
    catch (err) {
        console.log(err)
        return res.sendStatus(400)
    }
})

app.patch('/posts/:id', authenticateToken, async (req, res) => {
    const postObjectID = req.params.id
    const like = parseInt(req.body.like) || 0
    const dislike = parseInt(req.body.dislike) || 0
    const username = req.username

    if (((like === 1 && dislike === 1) || (like === -1 && dislike === -1))) return res.sendStatus(400)

    try {
        let notificationMessage = ''
        let socketObject
        let postAuthor = ''
        const foundPost = await Posts.findById(postObjectID).lean()

        postAuthor = foundPost.author
        const foundMilestoneIndex = postLikeMilestones.findIndex(milestone =>
            milestone === foundPost.likes + like && milestone === foundPost.nextLikeMilestone)
        const nextMilestoneExists = foundMilestoneIndex >= -1 ? (foundMilestoneIndex + 1 < postLikeMilestones.length) : false
        if (foundMilestoneIndex > -1) {
            notificationMessage = `your post has received ${postLikeMilestones[foundMilestoneIndex]} ${postLikeMilestones[foundMilestoneIndex] === 1 ? 'like' : 'likes'} 👍`
            socketObject = connectedUserSockets.find(obj => obj.username === foundPost.author)
        }

        const foundUser = await User.findOne({ username }).lean()

        /////////////////////////////

        let foundAlreadyLikedPostIndex = foundUser.postsLiked.findIndex((postLiked) => {
            return postLiked.postId.toString() === foundPost._id.toString()
        })

        if (foundAlreadyLikedPostIndex !== -1) {
            const actionDid = foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType

            if (actionDid === 'like' && like === -1) {
                foundPost.likes += like
                if (dislike === 0) foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'none'
                else if (dislike === 1) {
                    foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'dislike'
                    foundPost.dislikes += dislike
                }
            }
            else if (actionDid === 'dislike' && dislike === -1) {
                foundPost.dislikes += dislike
                if (like === 0) foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'none'
                else if (like === 1) {
                    foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'like'
                    foundPost.likes += like
                }
            }
            else if (actionDid === 'none' && like === 1) {
                foundPost.likes += like
                foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'like'
            }
            else if (actionDid === 'none' && dislike === 1) {
                foundPost.dislikes += dislike
                foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'dislike'
            }
            else return res.status(400).json({
                badRequest: true,
                actionDid: foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType
            })
        }
        else {
            foundPost.likes += like
            foundPost.dislikes += dislike
        }

        if (foundAlreadyLikedPostIndex < 0) {
            foundUser.postsLiked.unshift({})
            foundAlreadyLikedPostIndex = 0

            foundUser.postsLiked[foundAlreadyLikedPostIndex].postId = foundPost._id
        }

        foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = like === 1 ? 'like' :
            (dislike === 1 ? 'dislike' : 'none')

        foundPost.nextLikeMilestone = foundMilestoneIndex > -1 ?
            (nextMilestoneExists ? postLikeMilestones[foundMilestoneIndex + 1] : -1)
            : foundPost.nextLikeMilestone

        const updatedPost = await Posts.findByIdAndUpdate(postObjectID, foundPost, { new: true }).lean()

        updatedPost.commentsAmount = updatedPost.comments.length

        delete updatedPost.comments

        if (foundUser._id.toString() === updatedPost.userId.toString()) {
            updatedPost.isAuthor = true
        }

        /////////////////////////////

        await User.findOneAndUpdate({ username }, foundUser)

        if (like > 0 && notificationMessage !== '' && postAuthor !== '') {
            const foundAuthor = await User.findOne({ postAuthor }).lean()
            foundAuthor.notifications.unshift({})
            foundAuthor.notifications[0].message = notificationMessage
            foundAuthor.notifications[0].refId = postObjectID
            foundAuthor.notifications[0].notificationType = 'post'

            const updatedNotification = (await User.findOneAndUpdate({ postAuthor }, foundAuthor, { new: true })).notifications[0]

            if (socketObject) socketObject.socket.emit('notification', updatedNotification)
        }

        return res.status(200).json({ updatedPost: updatedPost })
    }
    catch (err) {
        console.error(err)
        return res.sendStatus(400)
    }
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const authToken = authHeader && authHeader.split(' ')[1]

    if (authToken === null) return res.sendStatus(401)
    else {
        jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403)

            req.username = user.username
            next()
        })
    }
}

function checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const authToken = authHeader && authHeader.split(' ')[1]

    if (authToken === null || authToken === undefined) next()
    else {
        jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) next()
            else {
                req.username = user.username
                next()
            }
        })
    }
}

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})

const io = require('socket.io')(server, {
    cors: {
        origin: "*"
    }
})

io.on('connection', (socket) => {
    const disconnect = () => {
        const index = connectedUserSockets.findIndex(obj => obj.socket.id == socket.id)
        if (index >= 0) connectedUserSockets.splice(index, 1)
    }

    socket.on('username', username => {
        connectedUserSockets.push({
            socket,
            username
        })
    })

    socket.on('close', () => disconnect())
    socket.on('disconnect', () => disconnect())

})