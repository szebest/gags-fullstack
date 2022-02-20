import classes from './styles/Post.module.scss'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'
import { Link, Redirect } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import SendButton from '../SendButton/SendButton'

function Post({ post, saveInLS, updatePost, index }) {
    const [loaded, setLoaded] = useState(false)
    const [action, setAction] = useState({
        like: post.actionType === 'like' ? 1 : 0,
        dislike: post.actionType === 'dislike' ? 1 : 0
    })
    const [tmpAction, tmpSetAction] = useState(action)
    const hasAccess = useSelector(state => state.hasAccess)
    const imageRef = useRef()
    const [openOptions, setOpenOptions] = useState(false)
    const optionsRef = useRef()
    const modalRef = useRef()

    const [commentClicked, setCommentClicked] = useState(false)
    const [redirectTo, setRedirectTo] = useState("")
    const [editing, setEditing] = useState(false)
    const [textEntered, setTextEntered] = useState("")
    const [shouldRedirect, setShouldRedirect] = useState(false)
    const { postID, sectionName } = useParams()

    useEffect(() => {
        setRedirectTo(window.location.pathname === "/" ? `post/${post._id}` : `${window.location.pathname}/post/${post._id}`)
    }, [window.location.pathname])

    useEffect(() => {
        if (!post._id) return

        if (localStorage.getItem('doNotSendLike') !== null) {
            localStorage.removeItem('doNotSendLike')
            return
        }

        const like = action.like - tmpAction.like
        const dislike = action.dislike - tmpAction.dislike

        tmpSetAction({...action})

        if (like === 0 && dislike === 0) return

        axios.patch(`https://gags-backend.herokuapp.com/posts/${post._id}`, {
            like, dislike
        }, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            const post = res.data.updatedPost
            if (saveInLS) localStorage.setItem('postToBeUpdated', JSON.stringify({
                likes: post.likes,
                dislikes: post.dislikes,
                title: post.title,
                action: action,
                _id: post._id
            }))
            updatePost(res.data.updatedPost, index)
        })
        .catch(err => {
            if (err.response?.data.badRequest === true) {
                setAction({
                    like: err.response.data.actionDid === 'like' ? 1 : 0,
                    dislike: err.response.data.actionDid === 'dislike' ? 1 : 0
                })
            }
        })
    }, [action])

    useEffect(() => {
        if (!post.actionType) return

        const obj = {
            like: post.actionType === 'like' ? 1 : 0,
            dislike: post.actionType === 'dislike' ? 1 : 0
        }

        tmpSetAction(obj)
        setAction(obj)
    }, [post && post.actionType])

    if (saveInLS === undefined) {
        const postIdToBeUpdated = localStorage.getItem('postToBeUpdated')
        const postIdToBeDeleted = localStorage.getItem('postToBeDeleted')

        if (postIdToBeDeleted !== null) {
            if (postIdToBeDeleted.toString() === post._id.toString()) {
                updatePost(null, index, true)
                localStorage.removeItem('postToBeDeleted')
            }
        }
        else if (postIdToBeUpdated !== null) {
            const postData = JSON.parse(postIdToBeUpdated)
            if (postData._id.toString() === post._id.toString()) {
                setTimeout(() => {
                    localStorage.setItem('doNotSendLike', true)
                    setAction({
                        like: postData.action.like,
                        dislike: postData.action.dislike
                    })
                }, 10)
                const tmpPost = {
                    ...post,
                    likes: postData.likes,
                    dislikes: postData.dislikes,
                    title: postData.title,
                }
                updatePost(tmpPost, index)

                localStorage.removeItem('postToBeUpdated')
            }
        }
    }

    function like() {
        if (!hasAccess) return

        const tmpState = action
        tmpState.dislike = 0
        tmpState.like = tmpState.like === 0 ? 1 : 0

        setAction({...tmpState})
    }

    function dislike() {
        if (!hasAccess) return
        
        const tmpState = action
        tmpState.like = 0
        tmpState.dislike = tmpState.dislike === 0 ? 1 : 0

        setAction({...tmpState})
    }

    useEffect(() => {
        if (editing === true) {
            setTextEntered(post.title)
        }
        setOpenOptions(false)
    }, [editing])

    function sendUpdateRequest() {
        var onlySpaces = true
        textEntered.split('').forEach((char) => {
            if (char !== ' ') onlySpaces = false
        })

        if (textEntered === post.title || onlySpaces) {
            setEditing(false)
            return
        }

        axios.patch(`https://gags-backend.herokuapp.com/posts/${post._id}/edit`, {
            title: textEntered
        }, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
            .then(res => {
                const post = res.data.updatedPost
                if (saveInLS) localStorage.setItem('postToBeUpdated', JSON.stringify({
                    likes: post.likes,
                    dislikes: post.dislikes,
                    title: post.title,
                    action: action,
                    _id: post._id
                }))
                updatePost(post, index)
                setEditing(false)
            })
            .catch(err => {
                console.error(err)
            })
    }

    const handleClick = (e) => {
        if (!openOptions && optionsRef.current && modalRef.current && !optionsRef.current.contains(e.target) && !modalRef.current.contains(e.target)) {
            setOpenOptions(false)
        }
    }

    useEffect(() => {
        document.body.addEventListener('click', handleClick)

        return () => {
            document.body.removeEventListener('click', handleClick)
        }
    }, [])

    function deleteThisPost() {
        setOpenOptions(false)

        axios.delete(`https://gags-backend.herokuapp.com/posts/${post._id}`, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
            .then(res => {
                if (postID !== undefined) {
                    if (saveInLS) localStorage.setItem('postToBeDeleted', res.data.deleted._id)

                    setShouldRedirect(true)
                }
                else updatePost(null, index, true)
            })
            .catch(err => {
                console.log(err)
            })
    }

    if (shouldRedirect) {
        return <Redirect to={sectionName === undefined ? "/" : `/section/${sectionName}`} />
    }

    if (commentClicked) {
        return <Redirect to={redirectTo} />
    }

    if (editing) {
        return (
            <div className={classes.postWrapper}>
                <div className={classes.content}>
                    <div className={classes.center}>
                        <textarea className={classes.textarea} value={textEntered} onChange={(e) => setTextEntered(e.target.value)}></textarea>
                    </div>
                    <div className={classes.center}>
                        <h6>Posted in {post.section} by {post.author}</h6>
                    </div>
                    <div className={`${classes.imageContainer} ${loaded ? "" : classes.minHeight}`}>
                        <img ref={imageRef} onLoad={() => setLoaded(true)} style={{height: imageRef.current && !loaded ? imageRef.current.naturalHeight + "px" : "inherit"}} src={post.imgSrc} className={classes.image} />
                    </div>
                </div>
                <div className={classes.actionButtons}>
                    <SendButton>
                        <input type="submit" value="Edit" onClick={() => {
                            setEditing(false)
                            sendUpdateRequest()
                        }} />
                    </SendButton>
                    <SendButton>
                        <input type="submit" value="Abort" onClick={() => setEditing(false)} />
                    </SendButton>
                </div>
            </div>
        )
    }

    return (
        <div className={classes.postWrapper}>
            <div className={classes.content}>
                <Link to={redirectTo}>
                    <div className={`${classes.center} ${classes.marginLeftRight}`}>
                        <h2>{post.title}</h2>
                    </div>
                </Link>
                <div className={classes.center}>
                    <h6>
                        Posted in <Link className={classes.underlineHover} to={`/section/${post.section}`}>{post.section}</Link> by <a className={classes.underlineHover} target="_blank" href={`/profile/${post.author}`}>{post.author}</a>
                    </h6>
                </div>
                <Link className={classes.fullWidth} to={redirectTo}>
                    <div className={`${classes.imageContainer} ${loaded ? "" : classes.minHeight}`}>
                        <img ref={imageRef} onLoad={() => setLoaded(true)} style={{height: imageRef.current && !loaded ? imageRef.current.naturalHeight + "px" : "inherit"}} src={post.imgSrc} className={classes.image} />
                    </div>
                </Link>
            </div>
            <div className={classes.statistics}>
                <div className={action.like ? classes.clicked : ""} onClick={like}>
                    <p>▲</p>
                    <p>{post.likes}</p>
                </div>
                <div className={action.dislike ? classes.clicked : ""} onClick={dislike}>
                    <p>▼</p>
                    <p>{post.dislikes}</p>
                </div>
                <div className={classes.noPointer}>
                    <p>💬</p>
                    <p>{post.commentsAmount}</p>
                </div>
                {post && post.isAuthor && 
                    <span className={classes.relativeWrapper}>
                        {openOptions &&
                            <div ref={modalRef} className={classes.optionsContainerContent}>
                                <p onClick={() => setEditing(true)}>Edit Post</p>
                                <p onClick={deleteThisPost}>Delete Post</p>
                            </div>
                        }
                        <div className={classes.statistics}>
                            <div ref={optionsRef} className={classes.options} onClick={() => setOpenOptions(prev => !prev)}>
                                <div className={classes.optionsContainerStyle}></div>
                                <div className={classes.optionsContainerStyle}></div>
                                <div className={classes.optionsContainerStyle}></div>
                            </div>
                        </div>
                    </span>
                }
            </div>
        </div>
    );
}

export default Post;
