import classes from './styles/PostModal.module.scss'
import React, {useEffect, useState} from 'react'
import ReactDom from 'react-dom'
import Post from '../Post/Post'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'

export default function PostModal() {
    const { sectionName } = useParams()
    const { postID } = useParams()

    const [post, setPost] = useState(null)

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
        document.body.classList.add("modal-open");

        return () => {
            document.body.classList.remove("modal-open");
        }
    })

    if (postID === undefined) return null

    return ReactDom.createPortal(
        <>
            <Link to={sectionName === undefined ? `/` : `/section/${sectionName}`} className={classes.overlay}></Link>
            <div className={classes.modalWrapper}>
                <div className={classes.postsContainerWrapper}>
                    <div className={classes.limitSpace}>
                        {post && <Post 
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
                        />}
                    </div>
                </div>
            </div>
        </>,
        document.getElementById('postModal')
    )
}
