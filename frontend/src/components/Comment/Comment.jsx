import classes from './styles/Comment.module.scss'
import React, { useState, useEffect, useRef } from 'react'
import NewComment from '../NewComment/NewComment'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

export default function Comment({ postID, comment, sendComment, updateThisComment, index }) {
    const [openReply, setOpenReply] = useState(false)
    const [openOptions, setOpenOptions] = useState(false)
    const [editing, setEditing] = useState(false)
    const [lastEdited, setLastEdited] = useState("")
    const optionsRef = useRef()
    const modalRef = useRef()
    const [textEntered, setTextEntered] = useState("")
    const [action, setAction] = useState({
        like: comment.actionType === 'like' ? 1 : 0,
        dislike: comment.actionType === 'dislike' ? 1 : 0
    })
    const [tmpAction, tmpSetAction] = useState(action)
    const [avatar, setAvatar] = useState(null)

    const hasAccess = useSelector(state => state.hasAccess)

    useEffect(() => {
        if (!comment) return

        axios({
            method: "GET",
            url: `http://localhost:3001/user/avatar/${comment.author}`,
        })
            .then(res => {
                setAvatar(res.data.imgSrc)
            })
            .catch(err => {
                console.error(err)
            })
    }, [comment])

    useEffect(() => {
        if (!comment._id) return

        const like = action.like - tmpAction.like
        const dislike = action.dislike - tmpAction.dislike

        tmpSetAction({ ...action })

        if (like === 0 && dislike === 0) return

        axios.patch(`http://localhost:3001/posts/${postID}/comment/${comment._id}`, {
            like, dislike
        }, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
            .then(res => {
                updateThisComment(res.data.updatedComment, index)
            })
            .catch(err => {
                console.log(err)
            })
    }, [action])

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

    useEffect(() => {
        if (editing === true) {
            setTextEntered(comment.comment)
        }
        setOpenOptions(false)
    }, [editing])

    function sendCommentForward(comment, parentComment) {
        setOpenReply(false)
        sendComment(comment, parentComment)
    }

    function like() {
        if (!hasAccess) return

        const tmpState = action
        tmpState.dislike = 0
        tmpState.like = tmpState.like === 0 ? 1 : 0

        setAction({ ...tmpState })
    }

    function dislike() {
        if (!hasAccess) return

        const tmpState = action
        tmpState.like = 0
        tmpState.dislike = tmpState.dislike === 0 ? 1 : 0

        setAction({ ...tmpState })
    }

    function sendUpdateRequest() {
        axios.patch(`http://localhost:3001/posts/${postID}/comment/${comment._id}`, {
            comment: textEntered
        }, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
            .then(res => {
                updateThisComment(res.data.updatedComment, index)
                setOpenReply(false)
                setEditing(false)
            })
            .catch(err => {
                console.error(err)
            })
    }

    const treatAsUTC = (date) => {
        const result = new Date(date)
        result.setMinutes(result.getMinutes() - result.getTimezoneOffset())

        return result
    }

    useEffect(() => {
        const dateNow = new Date()
        const commentTimestamp = comment.timestamp

        const millisecondsPerMinute = 60 * 1000
        const differenceInMinutes = Math.ceil((treatAsUTC(dateNow) - treatAsUTC(commentTimestamp)) / millisecondsPerMinute)

        if (differenceInMinutes < 60) {
            setLastEdited(differenceInMinutes + (differenceInMinutes === 1 ? " minute ago" : " minutes ago"))
            return
        }

        const millisecondsPerHour = 60 * 60 * 1000
        const differenceInHours = Math.ceil((treatAsUTC(dateNow) - treatAsUTC(commentTimestamp)) / millisecondsPerHour)

        if (differenceInHours < 24) {
            setLastEdited(differenceInHours + (differenceInHours === 1 ? " hour ago" : " hours ago"))
            return
        }

        const millisecondsPerDay = 24 * 60 * 60 * 1000
        const differenceInDays = Math.ceil((treatAsUTC(dateNow) - treatAsUTC(commentTimestamp)) / millisecondsPerDay)

        setLastEdited(differenceInDays + (differenceInDays === 1 ? " day ago" : " days ago"))
    }, [comment])

    if (editing) {
        return (
            <div className={classes.commentSplit}>
                <div key={comment._id} className={classes.commentContainer} >
                    <div className={classes.profilePictureHolder}>
                        <img alt="avatar" width="28" height="28" src={avatar} />
                    </div>
                    <div className={classes.contentHolder}>
                        <div className={classes.author}>
                            <a target="_blank" href={`/profile/${comment.author}`}>{comment.author}</a>
                        </div>
                    </div>
                </div>
                <textarea value={textEntered} onChange={(e) => setTextEntered(e.target.value)} />
                <div className={classes.actionButtons}>
                    <button onClick={() => {
                        setEditing(false)
                        sendUpdateRequest()
                    }}>Edit</button>
                    <button onClick={() => setEditing(false)}>Abort</button>
                </div>
            </div>
        )
    }

    return (
        <>
            {comment && comment.postTitle &&
                <div className={classes.postTitle}>
                    <h3>Commented in: <Link to={window.location.pathname === "/" ? `post/${comment.postId}` : `${window.location.pathname}/post/${comment.postId}`}>{comment.postTitle}</Link></h3>
                </div>
            }
            <div className={classes.commentSplit}>
                <div
                    key={comment._id}
                    className={classes.commentContainer}
                >
                    <div className={classes.profilePictureHolder}>
                        <img alt="avatar" width="28" height="28" src={avatar} />
                    </div>
                    <div className={classes.contentHolder}>
                        <div className={classes.author}>
                            <a target="_blank" href={`/profile/${comment.author}`}>{comment.author}</a>
                            <p>{lastEdited}</p>
                            {comment.edited && 
                                <p><i>Edited</i></p>
                            }
                        </div>
                        <div className={classes.comment}>{comment.comment}</div>
                    </div>
                </div>
                <div className={classes.commentControl}>
                    <div onClick={like} className={`${classes.controlContainer} ${classes.hoverBackground} ${action.like ? `${classes.activeLike}` : ''}`}>
                        <p>▲</p>
                        <p>{comment.likes}</p>
                    </div>
                    <div onClick={dislike} className={`${classes.controlContainer} ${classes.hoverBackground} ${action.dislike ? `${classes.activeLike}` : ''}`}>
                        <p>▼</p>
                        <p>{comment.dislikes}</p>
                    </div>
                    <div onClick={() => setOpenReply(prev => !prev)} className={`${classes.controlContainer} ${classes.hoverBackground}`}>
                        <p>Reply</p>
                    </div>
                    <div className={classes.relativeWrapper}>
                        {openOptions &&
                            <div ref={modalRef} className={classes.optionsContainerContent}>
                                <p onClick={() => setEditing(true)}>Edit Comment</p>
                                <p>Delete Comment</p>
                            </div>
                        }
                        {comment.isAuthor === true &&
                            <div ref={optionsRef} onClick={() => setOpenOptions(prev => !prev)} className={`${classes.optionsContainer} ${classes.controlContainer} ${classes.hoverBackground}`}>
                                <div className={classes.optionsContainerStyle}></div>
                                <div className={classes.optionsContainerStyle}></div>
                                <div className={classes.optionsContainerStyle}></div>
                            </div>
                        }
                    </div>
                </div>
                <div>
                    {openReply &&
                        <NewComment sendComment={sendCommentForward} parentComment={comment._id} />
                    }
                </div>
            </div>
        </>
    )
}
