import classes from './styles/CommentsContainer.module.scss'
import React, {useRef, useEffect, useState} from 'react'
import Comment from '../Comment/Comment'
import NewComment from '../NewComment/NewComment'
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'
import axios from 'axios'

export default function CommentsContainer({comments, callForMore, sectionName, ready, updateComment, sendComment, refreshComments, postID, showNewComment}) {
    const observeRef = useRef()
    const isVisible = useIsVisible(observeRef)
    const [avatars, setAvatars] = useState(new Map())
    const [previousComments, setPreviousComments] = useState([])

    useEffect(() => {
        let difference = comments.filter(x => !previousComments.includes(x))

        if (difference.length === 0) return

        setPreviousComments(comments)

        const avatarsCopy = avatars
        
        difference.forEach((comment) => {
            if (avatarsCopy.get(comment.author) !== undefined) return

            avatarsCopy.set(comment.author, null)
        })

        const promiseArray = []

        avatarsCopy.forEach((value, key) => {
            if (value !== null) return

            promiseArray.push(new Promise((resolve, reject) => {
                axios({
                    method: "GET",
                    url: `http://localhost:3001/user/avatar/${key}`,
                })
                    .then(res => {
                        avatarsCopy.set(key, res.data.imgSrc)
                        resolve()
                    })
                    .catch(() => {
                        resolve()
                    })
            }))
        })

        Promise.all(promiseArray).then(() => {
            setAvatars(avatarsCopy)
        }) 
    }, [comments])

    console.log(avatars)

    return (
        <>
            {showNewComment &&
            <NewComment sendComment={sendComment} parentComment={null}>
                <button onClick={refreshComments}>Refresh comment section</button>
            </NewComment>
            }
            <div className={classes.container}>
                <div className={classes.commentWrapper}>
                    {comments && comments.map((comment, index) => <Comment updateThisComment={updateComment} postID={postID === undefined ? comment.postId : postID} comment={comment} sendComment={sendComment} index={index} key={comment._id + avatars.get(comment.author)} avatar={avatars.get(comment.author)} />)}
                </div>
            </div>
            <div className={classes.observer} ref={observeRef} >
                
            </div>
        </>
    )
}
