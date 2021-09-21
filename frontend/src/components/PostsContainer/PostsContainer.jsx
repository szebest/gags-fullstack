import classes from './styles/PostsContainer.module.scss'
import Post from '../Post/Post';
import { useEffect, useState, useRef } from 'react'
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'
import axios from 'axios'
import Cookies from 'js-cookie'

function PostsContainer({ sectionName }) {
    const postsPerRequest = 5
    const [postNumber, setPostNumber] = useState(0)
    const [postsAvailable, setPostsAvailable] = useState(true)
    const [posts, setPosts] = useState([])
    const [postsLikedByUser, setPostsLikedByUser] = useState(null)
    const observeRef = useRef()
    const isVisible = useIsVisible(observeRef)

    const sendRequest = () => {
        axios({
            method: "GET",
            url: "http://localhost:3001/posts",
            params: new URLSearchParams({
                postNumber,
                postsPerRequest,
                section: sectionName ? sectionName : undefined
            })
        })
        .then(res => {
            setPostsAvailable(res.data.numberOfPostsLeft > 0)
            setPosts(prev => [...prev, ...res.data.posts])
            setPostNumber(prev => prev + postsPerRequest)
        })
        .catch(err => {
            console.error(err)
        })
    }

    useEffect(() => {
        axios.get('http://localhost:3001/posts/likedByUser', {
            headers: {
                Authorization: `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            setPostsLikedByUser(res.data.likedPosts)
        })
        .catch(err => {
            setPostsLikedByUser([])
            console.error(err)
        })
    }, [])

    useEffect(() => {
        if (isVisible && postsAvailable && postsLikedByUser) {
            sendRequest()
        }
    }, [isVisible, postsAvailable, postsLikedByUser])

    useEffect(() => {
        if (sectionName) {
            setPosts([])
            setPostNumber(0)
            setPostsAvailable(true)
        }
    }, [sectionName])

    return (
        <div className={classes.postsContainerWrapper}>
            {posts.map((post) => {
                let userActionType = null
                postsLikedByUser && postsLikedByUser.some((likedPost) => {
                    if (likedPost.postId === post._id) {
                        userActionType = likedPost.actionType
                        return true
                    }
                    return false
                })
                return <Post 
                    _id={post._id}
                    key={post._id} 
                    title={post.title}
                    author={post.author}
                    section={post.section}
                    imgSrc={post.imgSrc} 
                    likes={post.likes} 
                    dislikes={post.dislikes}
                    alreadyLiked={userActionType}
                    />
            }
            )}
            <div className={classes.observer} ref={observeRef} >
                
            </div>
        </div>
    );
}

export default PostsContainer;
