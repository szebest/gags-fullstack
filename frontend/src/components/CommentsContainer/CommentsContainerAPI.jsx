import classes from './styles/CommentsContainer.module.scss'
import React, {useState, useEffect} from 'react'
import Cookies from 'js-cookie'
import CommentsContainer from './CommentsContainer'
import axios from 'axios'

export default function CommentsContainerAPI({ sectionName, postID }) {
    const [comments, setComments] = useState()

    function refreshComments() {
        axios.get(`http://localhost:3001/posts/${postID}/comment`, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            setComments([...res.data.comments])
        })
        .catch(err => {
            console.log(err)
        })
    }

    function updateComment(updatedComment, index) {
        const tmpComments = comments
        tmpComments[index] = updatedComment
        setComments([...tmpComments])
    }

    function sendComment(comment, parentComment) {
        axios.post(`http://localhost:3001/posts/${postID}/comment`, {
            comment
        }, 
        {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            const tmpComments = [res.data.comment, ...comments]
            setComments([...tmpComments])
        })
        .catch(err => {
            console.log(err)
        })
    }

    useEffect(() => {
        if (comments) return

        refreshComments()
    }, [comments])

    return (
        <div className={classes.commentsContainerWrapper}>
            <CommentsContainer
                comments={comments}
                sectionName={sectionName}
                updateComment={updateComment}
                sendComment={sendComment}
                refreshComments={refreshComments}
                postID={postID}
            />
        </div>
    )
}
