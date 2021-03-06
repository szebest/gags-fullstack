import classes from './styles/Navbar.module.scss'
import { Link } from "react-router-dom"
import Cookies from 'js-cookie'
import { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import Notifications from '../Notifications/Notifications'

import baseURL from '../../util/baseUrlPage'
import useAuthorizedAxios from '../../hooks/useAuthorizedAxios'

function Navbar() {
    const [user, setUser] = useState({})
    const [showNotifications, setShowNotifications] = useState(false)
    const hasAccess = useSelector(state => state.hasAccess)
    const socket = useMemo(() => io(baseURL), [])
    const [burgerMenuClicked, setBurgerMenuClicked] = useState(false)
    const burgerMenuRef = useRef()
    const notificationsRef = useRef()

    const authorizedAxios = useAuthorizedAxios()

    useEffect(() => {
        socket.on('notification', (notification) => {
            user.notifications.unshift(notification)
            setUser(prev => {return {...prev}})
        })

        return () => {
            socket.off('notification')
        }
    }, [user])

    useEffect(() => {
        if (hasAccess !== undefined && hasAccess) {
            authorizedAxios.get(`/user/loggedIn}`)
            .then((res) => {
                setUser(res.data.user)
                socket.emit('username', res.data.user.username)
            })
            .catch(err => {
                
            })
        }
        else if (hasAccess !== undefined) socket.emit('close')
    }, [hasAccess])

    const logout = async () => {
        try {
            let res = await axios.post('http://localhost:3001/logout', {
                refreshToken: Cookies.get("refreshToken")
            })
            if (res.status === 200) {
                Cookies.set("accessToken", undefined)
                Cookies.set("refreshToken", undefined)
            }
            else
                throw Error("Server error, try again")
        }
        catch(err) {
            
        }
    }

    const handleClick = (e) => {
        if (burgerMenuClicked && !burgerMenuRef.current.contains(e.target)) setBurgerMenuClicked(prev => !prev)
        if (showNotifications && !notificationsRef.current.contains(e.target)) setShowNotifications(prev => !prev)
    }

    useEffect(() => {
        document.addEventListener('click', handleClick)

        return () => document.removeEventListener('click', handleClick)
    })
    
    return (
        <nav className={classes.loginWrapper}>
            <ul ref={burgerMenuRef} className={`${classes.listItems} ${burgerMenuClicked ? classes.showListItems : ""}`}>
            {!hasAccess &&
                <>
                    <li onClick={() => setBurgerMenuClicked(false)}>
                        <Link to="/login">LOGIN</Link>
                    </li>
                    <li onClick={() => setBurgerMenuClicked(false)}>
                        <Link to="/register">REGISTER</Link>
                    </li>
                </>
            }
            {hasAccess &&
                <>
                    <li onClick={() => setBurgerMenuClicked(false)}>
                        <Link to={`/profile/${user.username}`} className={classes.profile}>
                            <img 
                                alt="profile picture"
                                src={user.imgSrc}
                                height="48"
                                width="48"/>
                            <p>{user.username}</p>
                        </Link>
                    </li>
                    <li>
                        <div className={classes.circle} ref={notificationsRef}>
                            <div className={classes.center} onClick={() => setShowNotifications(prev => !prev)}>
                                <svg viewBox="0 0 28 28" alt="" height="20" width="20"><path d="M7.847 23.488C9.207 23.488 11.443 23.363 14.467 22.806 13.944 24.228 12.581 25.247 10.98 25.247 9.649 25.247 8.483 24.542 7.825 23.488L7.847 23.488ZM24.923 15.73C25.17 17.002 24.278 18.127 22.27 19.076 21.17 19.595 18.724 20.583 14.684 21.369 11.568 21.974 9.285 22.113 7.848 22.113 7.421 22.113 7.068 22.101 6.79 22.085 4.574 21.958 3.324 21.248 3.077 19.976 2.702 18.049 3.295 17.305 4.278 16.073L4.537 15.748C5.2 14.907 5.459 14.081 5.035 11.902 4.086 7.022 6.284 3.687 11.064 2.753 15.846 1.83 19.134 4.096 20.083 8.977 20.506 11.156 21.056 11.824 21.986 12.355L21.986 12.356 22.348 12.561C23.72 13.335 24.548 13.802 24.923 15.73Z"></path></svg>
                            </div>
                            <Notifications data={user.notifications} showModal={showNotifications} />
                        </div>
                    </li>
                    <li onClick={() => setBurgerMenuClicked(false)}>
                        <Link to="/upload">
                            <div className={classes.circle}>
                                <div className={classes.center}>
                                    <p>+</p>
                                </div>
                            </div>
                        </Link>
                    </li>
                    <li onClick={() => setBurgerMenuClicked(false)}>
                        <Link to="" onClick={logout}>LOGOUT</Link>
                    </li>
                </>
            }
            </ul>
            <div className={classes.burgerMenu} onClick={()  => setBurgerMenuClicked(true)}>
                <div></div>
            </div>
        </nav>
    );
}

export default Navbar;
