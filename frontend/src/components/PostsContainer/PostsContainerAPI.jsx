import classes from './styles/PostsContainer.module.scss'
import PostsContainer from './PostsContainer'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'

function PostsContainerAPI({ sectionName }) {
    const postsPerRequest = 5
    const [postNumber, setPostNumber] = useState(0)
    const [postsAvailable, setPostsAvailable] = useState(true)
    const [posts, setPosts] = useState([])

    function updatePost(updatedPost, index) {
        const tmpPosts = posts
        tmpPosts[index] = updatedPost
        setPosts([...tmpPosts])
    }

    const sendRequest = () => {
        if (!postsAvailable) return

        axios({
            method: "GET",
            url: "http://localhost:3001/posts",
            params: new URLSearchParams({
                postNumber,
                postsPerRequest,
                section: sectionName ? sectionName : undefined,
            }),
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
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
        setPosts([])
        setPostNumber(0)
        setPostsAvailable(true)
    }, [sectionName])

    return (
        <div className={classes.postsContainerWrapper}>
            <PostsContainer updatePost={updatePost} posts={posts} callForMore={sendRequest} sectionName={postsAvailable ? sectionName : ""} />
        </div>
    );
}

export default PostsContainerAPI;
