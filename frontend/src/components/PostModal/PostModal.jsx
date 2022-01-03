import classes from './styles/PostModal.module.scss'
import React, {useEffect, useState, useRef} from 'react'
import ReactDom from 'react-dom'
import Post from '../Post/Post'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { Scrollbars } from 'react-custom-scrollbars'
import Cookies from 'js-cookie'
import CommentsContainer from '../CommentsContainer/CommentsContainerAPI'

export default function PostModal() {
    const { sectionName } = useParams()
    const { postID } = useParams()

    const [post, setPost] = useState(null)
    
    function updatePost(updatedPost, index) {
        setPost({...updatedPost})
    }

    function getPost() {
        if (!postID) return
        axios({
            method: "GET",
            url: `http://localhost:3001/posts/${postID}`,
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            setPost(res.data.post)
        })
        .catch(err => {
            console.error(err)
        })
    }

    useEffect(() => {
        getPost()
    }, [postID])

    useEffect(() => {
        document.body.classList.add("modal-open")
        document.getElementsByTagName('html')[0].classList.add("modal-open")

        return () => {
            document.body.classList.remove("modal-open")
            document.getElementsByTagName('html')[0].classList.remove("modal-open")
        }
    }, [])

    if (postID === undefined) return null

    return ReactDom.createPortal(
        <>
            <Link to={window.location.pathname.split('/').reduce((previous, current, index, array) => {
                if (index + 2 < array.length) return previous + '/' + current
                else return previous
            })} className={`${classes.overlay} ${classes.fadeIn}`}></Link>
            {post && <div className={`${classes.modalWrapper} ${classes.fadeIn}`}>
                <Scrollbars
                    autoHide
                    autoHideTimeout={500}
                    autoHideDuration={200}>
                    <Post
                        key={post._id}
                        post={post}
                        updatePost={updatePost}
                        index={0}
                        saveInLS={true}
                    />
                    <CommentsContainer sectionName={sectionName} postID={postID} showNewComment />
                </Scrollbars>
            </div>}
        </>,
        document.getElementById('postModal')
    )
}
