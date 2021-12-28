import classes from './styles/PostModal.module.scss'
import React, {useEffect, useState, useRef} from 'react'
import ReactDom from 'react-dom'
import Post from '../Post/Post'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { Scrollbars } from 'react-custom-scrollbars'
import Cookies from 'js-cookie'
import NewComment from '../NewComment/NewComment'
import Comment from '../Comment/Comment'

export default function PostModal() {
    const { sectionName } = useParams()
    const { postID } = useParams()

    const [post, setPost] = useState(null)

    useEffect(() => {
        if (!postID) return
        axios({
            method: "GET",
            url: `http://localhost:3001/posts/${postID}`,
        })
        .then(res => {
            setPost(res.data.post)
        })
        .catch(err => {
            console.error(err)
        })
    }, [postID])

    useEffect(() => {
        document.body.classList.add("modal-open")
        document.getElementsByTagName('html')[0].classList.add("modal-open")

        return () => {
            document.body.classList.remove("modal-open")
            document.getElementsByTagName('html')[0].classList.remove("modal-open")
        }
    })

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
            const tmpPost = post
            tmpPost.comments = [res.data.comment, ...tmpPost.comments]
            setPost({...tmpPost})
        })
        .catch(err => {
            console.log(err)
        })
    }

    function refreshComments() {
        axios.get(`http://localhost:3001/posts/${postID}/comment`)
        .then(res => {
            const tmpPost = post
            tmpPost.comments = res.data.comments
            setPost({...tmpPost})
        })
        .catch(err => {
            console.log(err)
        })
    }

    if (postID === undefined) return null

    return ReactDom.createPortal(
        <>
            <Link to={sectionName === undefined ? `/` : `/section/${sectionName}`} className={`${classes.overlay} ${classes.fadeIn}`}></Link>
            {post && <div className={`${classes.modalWrapper} ${classes.fadeIn}`}>
                <Scrollbars
                    autoHide
                    autoHideTimeout={500}
                    autoHideDuration={200}>
                    <Post
                        _id={post._id}
                        key={post._id}
                        title={post.title}
                        author={post.author}
                        section={post.section}
                        imgSrc={post.imgSrc}
                        likes={post.likes}
                        dislikes={post.dislikes}
                        alreadyLiked={post.actionType}
                        sectionURL={sectionName}
                    />
                    <NewComment sendComment={sendComment} parentComment={null}>
                        <button onClick={refreshComments}>Refresh comment section</button>
                    </NewComment>
                    <div className={classes.container}>
                        <div className={classes.commentWrapper}>
                            {post.comments.map((comment, index) => <Comment comment={comment} sendComment={sendComment} />)}
                        </div>
                    </div>
                </Scrollbars>
            </div>}
        </>,
        document.getElementById('postModal')
    )
}
