import classes from './styles/PostsContainer.module.scss'
import PostsContainer from './PostsContainer'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useParams } from 'react-router-dom'
import useAuthorizedAxios from '../../hooks/useAuthorizedAxios'

function PostsContainerAPI({ sectionName, requestType, arePostsAvailable }) {
    const postsPerRequest = 5
    const [postNumber, setPostNumber] = useState(0)
    const [postsAvailable, setPostsAvailable] = useState(true)
    const [posts, setPosts] = useState([])
    const { profileName } = useParams()

    const authorizedAxios = useAuthorizedAxios(false)

    function updatePost(updatedPost, index, shouldBeDeleted) {
        setTimeout(() => {
            const tmpPosts = posts
            if (shouldBeDeleted === true) {
                tmpPosts.splice(index, 1)
                setPosts([...tmpPosts])
            }
            else {
                tmpPosts[index] = updatedPost
                setPosts([...tmpPosts])
            }
        }, 1)
    }

    useEffect(() => {
        if (arePostsAvailable)

        arePostsAvailable(posts.length)
    }, [posts])

    const getMainSitePosts = () => {
        if (!postsAvailable) return

        authorizedAxios.get('/posts', {
            params: new URLSearchParams({
                postNumber,
                postsPerRequest,
                section: sectionName ? sectionName : undefined,
            }),
        })
        .then(res => {
            setPostsAvailable(res.data.numberOfPostsLeft > 0)
            setPosts(prev => [...prev, ...res.data.posts])
            setPostNumber(prev => prev + postsPerRequest)
        })
        .catch(err => {
            
        })
    }

    const getPostsLiked = () => {
        if (!postsAvailable) return

        authorizedAxios.get(`/user/postsLiked/${profileName}`, {
            params: new URLSearchParams({
                postNumber,
                postsPerRequest,
                section: sectionName ? sectionName : undefined,
            })
        })
        .then(res => {
            setPostsAvailable(res.data.numberOfPostsLeft > 0)
            setPosts(prev => [...prev, ...res.data.posts])
            setPostNumber(prev => prev + postsPerRequest)
        })
        .catch(err => {
            
        })
    }

    const getPostsCreated = () => {
        if (!postsAvailable) return

        authorizedAxios.get(`/user/postsCreated/${profileName}`, {
            params: new URLSearchParams({
                postNumber,
                postsPerRequest,
                section: sectionName ? sectionName : undefined,
            })
        })
        .then(res => {
            setPostsAvailable(res.data.numberOfPostsLeft > 0)
            setPosts(prev => [...prev, ...res.data.posts])
            setPostNumber(prev => prev + postsPerRequest)
        })
        .catch(err => {
            
        })
    }
    
    let sendRequest

    switch (requestType) {
        case "default":
            sendRequest = getMainSitePosts
            break;
        case "liked":
            sendRequest = getPostsLiked
            break;
        case "created":
            sendRequest = getPostsCreated
            break;
        default:
            sendRequest = getMainSitePosts
            break;
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
