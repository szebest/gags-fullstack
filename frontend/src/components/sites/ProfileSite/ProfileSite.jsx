import classes from './styles/ProfileSite.module.scss'
import { useState, useEffect, useRef } from 'react'
import { Redirect } from "react-router-dom"
import Cookies from 'js-cookie'
import axios from 'axios'
import Post from '../../Post/Post'
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'

function ProfileSite({ hasAccess }) {
    const [user, setUser] = useState({})
    const [selected, setSelected] = useState(0)
    const [content, setContent] = useState([])
    const [daysActive, setDaysActive] = useState()

    const postsPerRequest = 2
    const [postNumber, setPostNumber] = useState(0)
    const [postsAvailable, setPostsAvailable] = useState(true)
    const observeRef = useRef()
    const isVisible = useIsVisible(observeRef)

    const treatAsUTC = (date) => {
        const result = new Date(date)
        result.setMinutes(result.getMinutes() - result.getTimezoneOffset())

        return result
    }

    const getPostsLiked = () => {
        const promises = []
        const requestArray = user.postsLiked.slice(postNumber, postsPerRequest)
        requestArray.forEach((post) => {
            const promise = new Promise((resolve, reject) => {
                axios.get(`http://localhost:3001/posts/${post.postId}`)
                .then(res => {
                    const postReceived = res.data.post
                    postReceived.liked = post.actionType 
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

        setPostNumber(prev => prev + postsPerRequest)

        console.log(postNumber + postsPerRequest >= user.postsLiked.length)

        if (postNumber + postsPerRequest >= user.postsLiked.length) setPostsAvailable(false)
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

    useEffect(() => {
        if (isVisible && postsAvailable && selected === 1) {
            getPostsLiked()
        }
    }, [isVisible, postsAvailable, selected, user])

    if (hasAccess !== undefined && !hasAccess)
        return <Redirect to="/" />

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
                    {content && content.length > 0 &&
                        content.map((post) => 
                            <Post
                                _id={post._id}
                                key={post._id}
                                title={post.title}
                                author={post.author}
                                section={post.section}
                                imgSrc={post.imgSrc}
                                likes={post.likes}
                                dislikes={post.dislikes}
                                alreadyLiked={post.liked}
                            />
                        )
                    }
                </div>
            </div>
            <div className={classes.observer} ref={observeRef} >

            </div>
        </div>
    );
}

export default ProfileSite;
