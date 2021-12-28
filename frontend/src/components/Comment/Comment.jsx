import classes from './styles/Comment.module.scss'
import React, {useState, useEffect} from 'react'
import NewComment from '../NewComment/NewComment'
import axios from 'axios'

export default function Comment({comment, sendComment}) {
    const [openReply, setOpenReply] = useState(false)
    const [action, setAction] = useState({
        like: 0,
        dislike: 0
    })
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

    function sendCommentForward(comment, parentComment) {
        setOpenReply(false)
        sendComment(comment, parentComment)
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
                <div className={`${classes.controlContainer} ${classes.hoverBackground}`}>
                    <p>▲</p>
                    <p>{comment.likes}</p>
                </div>
                <div className={`${classes.controlContainer} ${classes.hoverBackground}`}>
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
