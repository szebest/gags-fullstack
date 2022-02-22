import classes from './styles/CommentsContainer.module.scss'
import React, {useState, useEffect} from 'react'
import Cookies from 'js-cookie'
import CommentsContainer from './CommentsContainer'
import axios from 'axios'
import { useParams } from 'react-router-dom'

export default function CommentsContainerAPI({ sectionName, postID, requestType, arePostsAvailable, showNewComment }) {
    const [comments, setComments] = useState([])
    const { profileName } = useParams()

    let sendRequest

    function postComments() {
        axios.get(`https://gags-backend.herokuapp.com/posts/${postID}/comment`, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            setComments([...res.data.comments])
        })
        .catch(err => {
            
        })
    }

    function commentsCreated() {
        axios.get(`https://gags-backend.herokuapp.com/user/commentsCreated/${profileName}`, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            setComments([...res.data.comments])
        })
        .catch(err => {

        })
    }

    function commentsLiked() {
        axios.get(`https://gags-backend.herokuapp.com/user/commentsLiked/${profileName}`, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            setComments([...res.data.comments])
        })
        .catch(err => {

        })
    }

    useEffect(() => {
        if (arePostsAvailable)

        arePostsAvailable(comments.length > 0)
    }, [comments])

    function updateComment(updatedComment, index, shouldBeDeleted) {
        const tmpComments = comments

        if (shouldBeDeleted === true) {
            tmpComments.splice(index, 1)
            setComments([...tmpComments])
        }
        else {
            tmpComments[index] = {...tmpComments[index], ...updatedComment}
            setComments([...tmpComments])
        }
    }

    function sendComment(comment, parentComment) {
        axios.post(`https://gags-backend.herokuapp.com/posts/${postID}/comment`, {
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
