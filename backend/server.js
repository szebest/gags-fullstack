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
const { syncIndexes } = require('./models/user')

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
        if (users.length > 0) {
            res.status(409).json({ message: "A user with this login already exists"})
            return
        }
    }
    catch (err) {
        res.status(500).json({ message: err.message})
        return
    }
    
    const user = new User({
        username: username,
        password: hashedPassword,
        imgSrc: fileSrc,
        postsLiked: [],
        postsCreated: [],
        notifications: []
    })

    try {
        const newUser = await user.save()
        return res.status(201).json(newUser)
    }
    catch (err) {
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
        imgSrc: fileSrc
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
        return res.status(400).json({ message: err.message })
    }
})

app.get('/sections', (req, res) => {
    res.status(200).send({ sections: sections})
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

app.get('/posts', async (req, res) => {
    const firstPost = parseInt(req.query.postNumber)
    const amountOfReturnedPosts = parseInt(req.query.postsPerRequest)
    const section = req.query.section
    const accessToken = req.query.accessToken
    let username = ""

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (!err)
            username = user.username
    })

    try {
        const posts = section === 'undefined' ? await Posts.find().lean() : await Posts.find({ section }).lean()
        const userLikedPosts = username.length > 0 ? (await User.find({ username }))[0].postsLiked : []

        posts.reverse()
        const slicedPosts = posts.slice(firstPost, firstPost + amountOfReturnedPosts)

        userLikedPosts.forEach((likedPost) => {
            slicedPosts.forEach((post, index) => {
                if (likedPost.postId.toString() === post._id.toString())
                    slicedPosts[index].actionType = likedPost.actionType
            })
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

app.get('/posts/:id', async (req, res) => {
    const postID = req.params.id

    try {
        const found = await Posts.findById(postID)

        return res.status(200).json({ post: found })
    }
    catch(err) {
        return res.sendStatus(400)
    }
})

app.patch('/posts/:id', authenticateToken, async (req, res) => {
    const postObjectID = req.params.id
    const like = parseInt(req.query.like) || 0
    const dislike = parseInt(req.query.dislike) || 0
    const username = req.username

    if (like || dislike) {
        try {
            let notificationMessage = ''
            const foundPosts = [await Posts.findById(postObjectID)]
            foundPosts.forEach(async (post) => {
                const foundMilestoneIndex = postLikeMilestones.findIndex(milestone => 
                    milestone === post.likes + like && milestone === post.nextLikeMilestone)
                const nextMilestoneExists = foundMilestoneIndex >= -1 ? (foundMilestoneIndex + 1 < postLikeMilestones.length) : false
                await Posts.updateOne(post, {$set: {
                    likes: post.likes + like,
                    dislikes: post.dislikes + dislike,
                    nextLikeMilestone: foundMilestoneIndex > -1 ? 
                                        (nextMilestoneExists ? 
                                            postLikeMilestones[foundMilestoneIndex + 1] 
                                            : -1) 
                                        : post.nextLikeMilestone
                }})

                if (foundMilestoneIndex > -1) {
                    notificationMessage = `your post has received ${postLikeMilestones[foundMilestoneIndex]} likes 👍`
                    const socketObject = connectedUserSockets.find(obj => obj.username === post.author)
                    if (socketObject) socketObject.socket.emit('notification', notificationMessage)
                }
            })

            const foundUser = (await User.find({ username }))[0]
            let foundIndex = -1
            const exists = foundUser.postsLiked.some((postLiked, index) => {
                if (postLiked.postId.toString() === mongoose.Types.ObjectId(postObjectID).toString()) {
                    foundIndex = index
                    return true
                }
                return false
            })

            //aktualizacja albo dodanie nowe
            if (like > 0 || dislike > 0) {
                if (exists) {
                    foundUser.postsLiked[foundIndex].actionType = like === 1 ? 'like' : (dislike === 1 ? 'dislike' : 'none')
                    foundUser.postsLiked[foundIndex].timestamp = Date.now
                }
                else {
                    foundUser.postsLiked.unshift({})
                    foundUser.postsLiked[0].postId = postObjectID
                    foundUser.postsLiked[0].actionType = like === 1 ? 'like' : (dislike === 1 ? 'dislike' : 'none')
                }
                if (notificationMessage !== '') {
                    foundUser.notifications.unshift({})
                    foundUser.notifications[0].message = notificationMessage
                }
            }
            else if (exists) {
                foundUser.postsLiked.splice(foundIndex, 1)
            }

            await User.findOneAndUpdate({ username }, foundUser)

            return res.sendStatus(200)
        }
        catch(err) {
            console.error(err)
            return res.sendStatus(400)
        }
    }
    else {
        return res.sendStatus(500)
    }
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const authToken = authHeader && authHeader.split(' ')[1]

    if (authToken === null)
        return res.sendStatus(401)
    else {
        jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err)
                return res.sendStatus(403)
            
            req.username = user.username
            next()
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