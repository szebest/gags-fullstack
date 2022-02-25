import classes from './styles/CommentsContainer.module.scss'
import React, {useState, useEffect} from 'react'
import CommentsContainer from './CommentsContainer'
import { useParams } from 'react-router-dom'
import useAuthorizedAxios from '../../hooks/useAuthorizedAxios'

export default function CommentsContainerAPI({ sectionName, postID, requestType, arePostsAvailable, showNewComment }) {
    const [comments, setComments] = useState([])
    const { profileName } = useParams()

    const authorizedAxios = useAuthorizedAxios(false)

    let sendRequest

    function postComments() {
        authorizedAxios.get(`/posts/${postID}/comment`)
        .then(res => {
            setComments([...res.data.comments])
        })
        .catch(err => {
            
        })
    }

    function commentsCreated() {
        authorizedAxios.get(`/user/commentsCreated/${profileName}`)
        .then(res => {
            setComments([...res.data.comments])
        })
        .catch(err => {

        })
    }

    function commentsLiked() {
        authorizedAxios.get(`/user/commentsLiked/${profileName}`)
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
        authorizedAxios.post(`/posts/${postID}/comment`, {
            comment
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
