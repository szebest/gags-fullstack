import classes from './styles/CommentsContainer.module.scss'
import React, {useRef, useEffect} from 'react'
import Comment from '../Comment/Comment'
import NewComment from '../NewComment/NewComment'
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'

export default function CommentsContainer({comments, callForMore, sectionName, ready, updateComment, sendComment, refreshComments, postID, showNewComment}) {
    const observeRef = useRef()
    const isVisible = useIsVisible(observeRef)

    return (
        <>
            {showNewComment &&
            <NewComment sendComment={sendComment} parentComment={null}>
                <button onClick={refreshComments}>Refresh comment section</button>
            </NewComment>
            }
            <div className={classes.container}>
                <div className={classes.commentWrapper}>
                    {comments && comments.map((comment, index) => <Comment updateThisComment={updateComment} postID={postID === undefined ? comment.postId : postID} comment={comment} sendComment={sendComment} index={index} key={comment._id} />)}
                </div>
            </div>
            <div className={classes.observer} ref={observeRef} >
                
            </div>
        </>
    )
}
