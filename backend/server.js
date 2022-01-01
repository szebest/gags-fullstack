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
const { syncIndexes, findOneAndUpdate } = require('./models/user')

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

app.post('/hasAccess', (req, res) => {
    const accessToken = req.body.accessToken

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err) => {
        return res.send({access: !err})
    })
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
                const accessToken = jwt.sign({username: users[0].username}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.EXPIRES_IN })
                const refreshToken = jwt.sign({username: users[0].username}, process.env.REFRESH_TOKEN_SECRET)

                const refresh = new Refresh({
                    refreshToken,
                    username
                })
            
                try {
                    await refresh.save()
                    res.status(201).json({ accessToken, refreshToken, expiresIn: process.env.EXPIRES_IN })
                }
                catch (err) {
                    res.status(400).json({ message: err.message})
                }
            }
            else
                res.status(401).json({ message: "Wrong password" })
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message})
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

    let imageResult = await sharp(req.file.buffer)
                            .resize({ width: 100, height: 100 })
                            .toFormat(req.file.mimetype.split('/')[1])
                            .toBuffer()

    const fileSrc = await uploadFile(req.file.mimetype, req.file.originalname, imageResult.buffer, '1Rw43VHhxDzmpsY-CVfPeUjH1-ee5gyfh')

    try {
        const users = await User.find({username})
        if (users.length > 0) return res.status(409).json({ message: "A user with this login already exists"})
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: err.message})
    }
    
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
        return res.status(400).json({ message: err.message})
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

    const post = new Posts({
        author: username,
        title,
        section,
        imgSrc: fileSrc,
        comments: []
    })

    try {
        const newPost = await post.save()
        
        const user = (await User.find({ username }))[0]

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
    res.status(200).send({ sections: sections})
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
    catch(err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get('/user/:accessToken', (req, res) => {
    const accessToken = req.params.accessToken

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
        if (err)
            return res.sendStatus(403)
        
        const username = user.username

        const users = await User.find({username})

        res.status(200).send({user: users[0]})
    })
})

app.get('/user/avatar/:username', async (req, res) => {
    const username = req.params.username

    try {
        const foundUser = (await User.find({ username }).lean())[0]

        return res.status(200).send({imgSrc: foundUser.imgSrc})
    }
    catch(err) {
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
        const userLikedPosts = username ? (await User.findOne({ username })).postsLiked : []

        const slicedPosts = posts.reverse().slice(firstPost, firstPost + amountOfReturnedPosts).map((slicedPost) => {
            userLikedPosts.forEach((likedPost) => {
                if (likedPost.postId && likedPost.postId.toString() === slicedPost._id.toString())
                    slicedPost.actionType = likedPost.actionType
            })

            slicedPost.commentsAmount = slicedPost.comments.length
            delete slicedPost.comments
            
            return slicedPost
        })

        const numberOfPostsLeft = Math.max(posts.length - firstPost - amountOfReturnedPosts, 0)
        return res.status(200).json({ 
            posts: slicedPosts, 
            numberOfPostsLeft
        })
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

        found.comments = found.comments ?? []
        found.comments.unshift({})
        found.comments[0].postID = postID
        //TODO: add children comments to the parent comment
        parentCommentID ? found.comments[0].parentCommentId = parentCommentID : ""
        found.comments[0].author = username
        found.comments[0].comment = comment
        found.comments[0].likes = 0
        found.comments[0].dislikes = 0

        const updatedPost = await Posts.findByIdAndUpdate(postID, found, {new: true})

        return res.status(200).send({ comment: updatedPost.comments[0] })
    }
    catch(err) {
        console.log(err)
        return res.sendStatus(400)
    }
})

app.patch('/posts/:postID/comment/:commentID', authenticateToken, async (req, res) => {
    const postID = req.params.postID
    const commentID = req.params.commentID
    const like = parseInt(req.body.like) || 0
    const dislike = parseInt(req.body.dislike) || 0
    const username = req.username

    if (((like === 1 && dislike === 1) || (like === -1 && dislike === -1))) return res.sendStatus(400)

    try {
        const foundPost = await Posts.findById(postID).lean()

        const foundUser = (await User.find({ username }).lean())[0]

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
            
            if (actionDid === 'dislike' && dislike === -1) {
                foundPost.comments[foundCommentIndex].dislikes += dislike
                if (like === 0) foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'none'
                else if (like === 1) {
                    foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'like'
                    foundPost.comments[foundCommentIndex].likes += like
                }
            }

            if (actionDid === 'none' && like === 1 && dislike === 0) {
                foundPost.comments[foundCommentIndex].likes += like
                foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'like'
            }

            if (actionDid === 'none' && dislike === 1 && like === 0) {
                foundPost.comments[foundCommentIndex].dislikes += dislike
                foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = 'dislike'
            }
        }
        else {
            foundPost.comments[foundCommentIndex].likes += like 
            foundPost.comments[foundCommentIndex].dislikes += dislike
        }

        if (foundAlreadyLikedCommentIndex < 0) {
            foundUser.commentsLiked.unshift({})
            foundAlreadyLikedCommentIndex = 0

            foundUser.commentsLiked[foundAlreadyLikedCommentIndex].commentId = foundPost.comments[foundCommentIndex]._id
        }

        foundUser.commentsLiked[foundAlreadyLikedCommentIndex].actionType = like === 1 ? 'like' :
                                                    (dislike === 1 ? 'dislike' : 'none')

        await Posts.findByIdAndUpdate(postID, foundPost)

        await User.findOneAndUpdate({username}, foundUser)

        return res.status(200).send({ updatedComment: foundPost.comments[foundCommentIndex] })
    }
    catch(err) {
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
            const foundUser = await User.findOne({ username })

            const foundUserIndex = foundUser.postsLiked.findIndex((postLiked) => {
                return postLiked.postId && postLiked.postId.toString() === mongoose.Types.ObjectId(postID).toString()
            })

            if (foundUserIndex >= 0) found.actionType = foundUser.postsLiked[foundUserIndex].actionType 
        }

        found.commentsAmount = found.comments.length

        delete found.comments

        return res.status(200).json({ post: found })
    }
    catch(err) {
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
            const foundUser = await User.findOne({username})

            found.comments.map((comment) => {
                const foundIndex = foundUser.commentsLiked.findIndex((commentLiked) => {
                    return commentLiked.commentId.toString() === comment._id.toString()
                })
                if (foundIndex !== -1) {
                    comment.actionType = foundUser.commentsLiked[foundIndex].actionType
                }
                return comment
            })
        }

        return res.status(200).json({ comments: found.comments })
    }
    catch(err) {
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

            if (actionDid === 'dislike' && dislike === -1) {
                foundPost.dislikes += dislike
                if (like === 0) foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'none'
                else if (like === 1) {
                    foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'like'
                    foundPost.likes += like
                }
            }

            if (actionDid === 'none' && like === 1 && dislike === 0) {
                foundPost.likes += like
                foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'like'
            }

            if (actionDid === 'none' && dislike === 1 && like === 0) {
                foundPost.dislikes += dislike
                foundUser.postsLiked[foundAlreadyLikedPostIndex].actionType = 'dislike'
            }
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

        const updatedPost = await Posts.findByIdAndUpdate(postObjectID, foundPost, {new: true}).lean()

        updatedPost.commentsAmount = updatedPost.comments.length

        delete updatedPost.comments

        /////////////////////////////

        await User.findOneAndUpdate({ username }, foundUser)

        if (like > 0 && notificationMessage !== '' && postAuthor !== '') {
            const foundAuthor = (await User.find({ postAuthor }))[0]
            foundAuthor.notifications.unshift({})
            foundAuthor.notifications[0].message = notificationMessage
            foundAuthor.notifications[0].refId = postObjectID
            foundAuthor.notifications[0].notificationType = 'post'

            await User.findOneAndUpdate({ postAuthor }, foundAuthor)

            if (socketObject) socketObject.socket.emit('notification', foundAuthor.notifications[0])
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

    if (authToken === null)
        next()
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