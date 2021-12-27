import classes from './styles/PostModal.module.scss'
import React, {useEffect, useState, useRef} from 'react'
import ReactDom from 'react-dom'
import Post from '../Post/Post'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { Scrollbars } from 'react-custom-scrollbars'
import Cookies from 'js-cookie'

export default function PostModal() {
    const { sectionName } = useParams()
    const { postID } = useParams()

    const [post, setPost] = useState(null)

    const [disabledBtn, setDisabledBtn] = useState(false)
    const commentRef = useRef(null)

    useEffect(() => {
        if (postID === undefined) return
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

    function sendComment() {
        setDisabledBtn(true)
        axios.post(`http://localhost:3001/posts/${postID}/comment`, {
            comment: commentRef.current.value
        }, 
        {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            const tmpPost = post
            tmpPost.comments = [res.data.comment, ...tmpPost.comments]
            setPost(tmpPost)
        })
        .catch(err => {
            console.log(err)
        })
        .finally(() => {
            setDisabledBtn(false)
        })
    }

    function refreshComments() {
        axios.get(`http://localhost:3001/posts/${postID}/comment`)
        .then(res => {
            const tmpPost = post
            tmpPost.comments = res.data.comments
            setPost(tmpPost)
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
                    <div className={classes.newComment}>
                        <textarea ref={commentRef} />
                        <button disabled={disabledBtn} onClick={sendComment}>Comment</button>
                        <button onClick={refreshComments}>Refresh comment section</button>
                    </div>
                    <div className={classes.container}>
                        <div className={classes.commentWrapper}>
                            {post.comments.map((comment, index) => {
                                return (<div className={classes.commentSplit}>
                                    <div 
                                        key={comment._id}
                                        className={`${classes.commentContainer} ${index === 0 ? `${classes.fadeIn} ${classes.dur1s}` : ``}`}
                                    >
                                        <div className={classes.profilePictureHolder}>
                                            <img alt="avatar" width="28" height="28" src="https://drive.google.com/uc?id=1pbqFiCHy1D2SEvnIS-r50qBG5mL0enlK"/>
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
                                        <div className={`${classes.controlContainer} ${classes.hoverBackground}`}>
                                            <p>Reply</p>
                                        </div>
                                    </div>
                                </div>)
                            })}
                        </div>
                    </div>
                </Scrollbars>
            </div>}
        </>,
        document.getElementById('postModal')
    )
}
