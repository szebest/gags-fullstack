import classes from './styles/PostsContainer.module.scss'
import PostsContainer from './PostsContainer'
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'

function PostsContainerAPI({ sectionName }) {
    const postsPerRequest = 5
    const [postNumber, setPostNumber] = useState(0)
    const [postsAvailable, setPostsAvailable] = useState(true)
    const [posts, setPosts] = useState([])

    const sendRequest = () => {
        if (!postsAvailable) return

        axios({
            method: "GET",
            url: "http://localhost:3001/posts",
            params: new URLSearchParams({
                postNumber,
                postsPerRequest,
                section: sectionName ? sectionName : undefined,
                accessToken: Cookies.get("accessToken")
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
        if (sectionName) {
            setPosts([])
            setPostNumber(0)
            setPostsAvailable(true)
        }
    }, [sectionName])

    return (
        <div className={classes.postsContainerWrapper}>
            <PostsContainer posts={posts} callForMore={sendRequest} />
        </div>
    );
}

export default PostsContainerAPI;
