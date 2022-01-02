import classes from './styles/ProfileSite.module.scss'
import { useState, useEffect } from 'react'
import { Redirect } from "react-router-dom"
import Cookies from 'js-cookie'
import axios from 'axios'
import PostsContainer from '../../PostsContainer/PostsContainer'
import { useSelector } from 'react-redux'
import CommentsContainer from '../../CommentsContainer/CommentsContainer'

function ProfileSite() {
    const [user, setUser] = useState({})
    const [selected, setSelected] = useState(0)
    const [content, setContent] = useState([])
    const [daysActive, setDaysActive] = useState()

    const postsPerRequest = 5
    const [postNumber, setPostNumber] = useState(0)
    const [postsAvailable, setPostsAvailable] = useState(true)

    const hasAccess = useSelector(state => state.hasAccess)

    const treatAsUTC = (date) => {
        const result = new Date(date)
        result.setMinutes(result.getMinutes() - result.getTimezoneOffset())

        return result
    }

    const getPostsLiked = () => {
        if (!postsAvailable) return

        const promises = []
        const requestArray = user.postsLiked.slice(postNumber, postNumber + postsPerRequest)
        requestArray.forEach((post) => {
            const promise = new Promise((resolve, reject) => {
                axios.get(`http://localhost:3001/posts/${post.postId}`)
                .then(res => {
                    const postReceived = res.data.post
                    postReceived.actionType = post.actionType 
                    resolve(postReceived)
                })
                .catch(err => {
                    console.log(err)
                    reject()
                })
            })
            promises.push(promise)
        })

        Promise.all(promises).then((values) => {
            setContent(prev => [...prev, ...values])
        })

        if (postNumber >= user.postsLiked.length) setPostsAvailable(false)
        
        setPostNumber(prev => prev + postsPerRequest)
    }

    const getPostsCreated = () => {
        if (!postsAvailable) return
    
        const promises = []
        const requestArray = user.postsCreated.slice(postNumber, postNumber + postsPerRequest)
        requestArray.forEach((post) => {
            const promise = new Promise((resolve, reject) => {
                axios.get(`http://localhost:3001/posts/${post.postId}`)
                .then(res => {
                    const postReceived = res.data.post
                    let actionType = null
                    const exists = user.postsLiked.some((postLiked) => {
                        if (post.postId.toString() === postLiked.postId.toString()) {
                            actionType = postLiked.actionType
                            return true
                        }

                        return false
                    })
                    postReceived.actionType = actionType
                    resolve(postReceived)
                })
                .catch(err => {
                    console.log(err)
                    reject()
                })
            })
            promises.push(promise)
        })

        Promise.all(promises).then((values) => {
            setContent(prev => [...prev, ...values])
        })

        if (postNumber >= user.postsCreated.length) setPostsAvailable(false)
        
        setPostNumber(prev => prev + postsPerRequest)
    }

    useEffect(() => {
        axios.get(`http://localhost:3001/user/${Cookies.get("accessToken")}`)
        .then((res) => {
            setUser(res.data.user)
        })
        .catch(err => {
            console.log(err)
        })
    }, [selected])

    useEffect(async () => {
        setPostsAvailable(true)
        setPostNumber(0)
        setContent([])
    }, [selected])

    useEffect(() => {
        const dateNow = new Date()
        const dateJoined = user.joined

        const millisecondsPerDay = 24 * 60 * 60 * 1000
        const differenceInDays = Math.floor((treatAsUTC(dateNow) - treatAsUTC(dateJoined)) / millisecondsPerDay)

        setDaysActive(differenceInDays)
    }, [user])

    if (hasAccess !== null && !hasAccess)
        return <Redirect to="/" />

    if (hasAccess === null) 
        return null

    return (
        <div className={classes.siteCenter}>
            <div className={classes.siteCenter}>
                <div className={classes.profileSiteWrapper}>
                    <div className={classes.profileInfo}>
                        <div className={classes.userInfo}>
                            <img alt="profile" src={user.imgSrc} />
                            <div>
                                <h2>{user.username}</h2>
                                <p>Active for {daysActive} days</p>
                            </div>
                        </div>
                        <div className={classes.about}>
                            {user.about}
                        </div>
                    </div>
                </div>
                <div className={classes.options}>
                    <ul>
                        <li onClick={() => setSelected(0)} className={selected === 0 ? classes.selected : null}>
                            Posts created
                        </li>
                        <li onClick={() => setSelected(1)} className={selected === 1 ? classes.selected : null}>
                            Posts liked
                        </li>
                        <li onClick={() => setSelected(2)} className={selected === 2 ? classes.selected : null}>
                            Posts commented
                        </li>
                    </ul>
                </div>
                <div className={classes.content}>
                    {content && content.length === 0 && 
                        <div className={classes.siteCenter}>
                            <div className={classes.suchEmpty}>
                                <p>GAGS</p>
                            </div>
                            <p>Wow, such empty</p>
                        </div>
                    }
                    {selected === 0 &&
                        <PostsContainer posts={content} callForMore={getPostsCreated} ready={Object.keys(user).length !== 0} />
                    }
                    {selected === 1 &&
                        <PostsContainer posts={content} callForMore={getPostsLiked} ready={Object.keys(user).length !== 0} />
                    }
                    {
                        <CommentsContainer />
                    }
                </div>
            </div>
        </div>
    );
}

export default ProfileSite;
