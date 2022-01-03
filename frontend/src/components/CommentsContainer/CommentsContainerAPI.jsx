import classes from './styles/CommentsContainer.module.scss'
import React, {useState, useEffect} from 'react'
import Cookies from 'js-cookie'
import CommentsContainer from './CommentsContainer'
import axios from 'axios'

export default function CommentsContainerAPI({ sectionName, postID, requestType, arePostsAvailable, showNewComment }) {
    const [comments, setComments] = useState([])

    let sendRequest

    function postComments() {
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

    function commentsCreated() {
        axios.get(`http://localhost:3001/user/commentsCreated`, {
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

    function commentsLiked() {
        axios.get(`http://localhost:3001/user/commentsLiked`, {
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

    useEffect(() => {
        if (arePostsAvailable)

        arePostsAvailable(comments.length > 0)
    }, [comments])

    function updateComment(updatedComment, index) {
        const tmpComments = comments
        tmpComments[index] = {...tmpComments[index], ...updatedComment}
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

    switch (requestType) {
        case "default":
            sendRequest = postComments
            break;
        case "liked":
            sendRequest = commentsLiked
            break;
        case "created":
            sendRequest = commentsCreated
            break;
        default:
            sendRequest = postComments
            break;
    }

    useEffect(() => {
        if (comments.length > 0) return

        sendRequest()
    }, [])

    return (
        <div className={classes.commentsContainerWrapper}>
            <CommentsContainer
                comments={comments}
                sectionName={sectionName}
                updateComment={updateComment}
                sendComment={sendComment}
                refreshComments={sendRequest}
                postID={postID}
                showNewComment={showNewComment}
            />
        </div>
    )
}
