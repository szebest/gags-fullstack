import classes from './styles/Login.module.scss'
import { Link } from "react-router-dom"
import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

function Login() {
    const [user, setUser] = useState({})
    const hasAccess = useSelector(state => state.hasAccess)

    useEffect(() => {
        socket.on('notification', (message) => alert(message))
    }, [])

    useEffect(() => {
        if (hasAccess !== undefined && hasAccess) {
            axios.get(`http://localhost:3001/user/${Cookies.get("accessToken")}`)
            .then((res) => {
                setUser(res.data.user)
                socket.emit('username', res.data.user.username)
            })
            .catch(err => {
                console.log(err)
            })
        }
        else if (hasAccess !== undefined) socket.emit('close')
    }, [hasAccess])

    const logout = async () => {
        try {
            let res = await axios.post('http://localhost:3001/logout', {
                refreshToken: Cookies.get("refreshToken")
            })
            console.log(res)
            if (res.status === 200) {
                Cookies.set("accessToken", undefined)
                Cookies.set("refreshToken", undefined)
            }
            else
                throw Error("Server error, try again")
        }
        catch(err) {
            console.log(err)
        }
    }
    
    return (
        <div className={classes.loginWrapper}>
            <ul>
            {!hasAccess &&
                <>
                    <li>
                        <Link to="/login">LOGIN</Link>
                    </li>
                    <li>
                        <Link to="/register">REGISTER</Link>
                    </li>
                </>
            }
            {hasAccess &&
                <>
                    <li>
                        <Link to="/profile" className={classes.profile}>
                            <img 
                                alt="profile picture"
                                src={user.imgSrc}
                                height="48"
                                width="48"/>
                            <p>{user.username}</p>
                        </Link>
                    </li>
                    <li>
                        <Link to="/upload">+ UPLOAD</Link>
                    </li>
                    <li>
                        <Link to="" onClick={logout}>LOGOUT</Link>
                    </li>
                </>
            }
            </ul>
        </div>
    );
}

export default Login;
