import classes from './styles/Comment.module.scss'
import React, {useState, useEffect} from 'react'
import NewComment from '../NewComment/NewComment'
import axios from 'axios'
import Cookies from 'js-cookie'

export default function Comment({postID, comment, sendComment, updateThisComment, index}) {
    const [openReply, setOpenReply] = useState(false)
    const [action, setAction] = useState({
        like: comment.actionType === 'like' ? 1 : 0,
        dislike: comment.actionType === 'dislike' ? 1 : 0
    })
    const [tmpAction, tmpSetAction] = useState(action)
    const [avatar, setAvatar] = useState(null)

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

        tmpSetAction({...action})

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

    function sendCommentForward(comment, parentComment) {
        setOpenReply(false)
        sendComment(comment, parentComment)
    }

    function like() {
        const tmpState = action
        tmpState.dislike = 0
        tmpState.like = tmpState.like === 0 ? 1 : 0


        setAction({...tmpState})
    }

    function dislike() {
        const tmpState = action
        tmpState.like = 0
        tmpState.dislike = tmpState.dislike === 0 ? 1 : 0

        setAction({...tmpState})
    }

    return (
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
            </div>
            <div>
                {openReply && 
                <NewComment sendComment={sendCommentForward} parentComment={comment._id} />
                }
            </div>
        </div>
    )
}
