import classes from './styles/Login.module.scss'
import { Link } from "react-router-dom"
import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'
import axios from 'axios'

function Login({ hasAccess }) {
    const [user, setUser] = useState({})

    useEffect(() => {
        if (hasAccess) {
            axios.get(`http://localhost:3001/user/${Cookies.get("accessToken")}`)
            .then((res) => {
                console.log(res.data.user)
                setUser(res.data.user)
            })
            .catch(err => {
                console.log(err)
            })
        }
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
