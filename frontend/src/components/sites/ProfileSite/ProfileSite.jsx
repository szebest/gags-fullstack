import classes from './styles/ProfileSite.module.scss'
import { useState, useEffect } from 'react'
import { Redirect } from "react-router-dom"
import PostsContainerAPI from '../../PostsContainer/PostsContainerAPI'
import CommentsContainerAPI from '../../CommentsContainer/CommentsContainerAPI'
import { useParams } from 'react-router-dom'

import useUnauthorizedAxios from '../../../hooks/useUnauthorizedAxios'

function ProfileSite() {
    const [user, setUser] = useState(undefined)
    const [selected, setSelected] = useState(0)
    const [daysActive, setDaysActive] = useState()
    const [postsAvailable, setPostsAvailable] = useState(true)
    const [error, setError] = useState(null)
    const { profileName } = useParams()

    const unauthorizedAxios = useUnauthorizedAxios()

    const treatAsUTC = (date) => {
        const result = new Date(date)
        result.setMinutes(result.getMinutes() - result.getTimezoneOffset())

        return result
    }

    function arePostsAvailable(value) {
        setPostsAvailable(value)
    }

    useEffect(() => {
        setUser(undefined)
        unauthorizedAxios.get(`/user/${profileName}`)
        .then((res) => {
            setUser(res.data.user)
            setError(false)
        })
        .catch(err => {
            setError(true)
        })
    }, [profileName])

    useEffect(() => {
        if (user === undefined) return
        
        const dateNow = new Date()
        const dateJoined = user.joined

        const millisecondsPerDay = 24 * 60 * 60 * 1000
        const differenceInDays = Math.floor((treatAsUTC(dateNow) - treatAsUTC(dateJoined)) / millisecondsPerDay)

        setDaysActive(differenceInDays)
    }, [user])

    if (error === true) 
        return <Redirect to="/" />

    if (error === null)
        return null

    return (
        <div className={classes.siteCenter}>
            <div className={classes.siteCenter}>
                <div className={classes.profileSiteWrapper}>
                    {user !== undefined && 
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
                    }
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
                            Comments created
                        </li>
                        <li onClick={() => setSelected(3)} className={selected === 3 ? classes.selected : null}>
                            Comments liked
                        </li>
                    </ul>
                </div>
                <div className={classes.content}>
                    {!postsAvailable && 
                        <div className={classes.siteCenter}>
                            <div className={classes.suchEmpty}>
                                <p>GAGS</p>
                            </div>
                            <p>Wow, such empty</p>
                        </div>
                    }
                    {user !== undefined && selected === 0 &&
                        <PostsContainerAPI requestType={"created"} arePostsAvailable={arePostsAvailable} />
                    }
                    {user !== undefined && selected === 1 &&
                        <PostsContainerAPI requestType={"liked"} arePostsAvailable={arePostsAvailable} />
                    }
                    {user !== undefined && selected === 2 &&
                        <CommentsContainerAPI requestType={"created"} arePostsAvailable={arePostsAvailable} />
                    }
                    {user !== undefined && selected === 3 &&
                        <CommentsContainerAPI requestType={"liked"} arePostsAvailable={arePostsAvailable} />
                    }
                </div>
            </div>
        </div>
    );
}

export default ProfileSite;
