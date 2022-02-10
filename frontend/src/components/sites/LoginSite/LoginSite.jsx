import classes from './styles/LoginSite.module.scss'
import { useState } from 'react'
import axios from 'axios'
import { Redirect, Link } from 'react-router-dom'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'

function LoginSite() {
    const queryParam = new URLSearchParams(document.location.search).get("username")
    const [usernameState, setUsernameState] = useState(queryParam ? queryParam : "")
    const [passwordState, setPasswordState] = useState("")
    const [error, setError] = useState("")
    const [, setLoading] = useState(false)
    const hasAccess = useSelector(state => state.hasAccess)

    if (hasAccess !== null && hasAccess)
        return <Redirect to="/" />

    const handleSubmit = (e) => {
        e.preventDefault()

        setError("")
        setLoading(true)

        axios.post('http://localhost:3001/login', {
            username: usernameState,
            password: passwordState
        })
        .then(res => {
            if (res.status === 201) {
                Cookies.set("accessToken", res.data.accessToken)
                Cookies.set("refreshToken", res.data.refreshToken)
                Cookies.set("expiresIn", res.data.expiresIn)
            }
            setLoading(false)
        })
        .catch(err => {
            setError(err.response ? err.response.data.message : "Server is not responding")
            setLoading(false)
        })
    }

    if (hasAccess === null) 
        return (
            <>
            </>
        )

    return (
        <div className={classes.loginSiteWrapper}>
            <div className={classes.mainContent}>
                <h1>Login to Your Account</h1>
                <form className={classes.loginSiteForm} onSubmit={handleSubmit}>
                    <div className={classes.inputData}>
                        <div className={classes.inputDataWrapper}>
                            <input className={usernameState.length > 0 ? classes.hasValue : ""} type="text" value={usernameState} onChange={(e) => setUsernameState(e.target.value)}/>
                            <label>Username</label>
                        </div>
                    </div>
                    <div className={classes.inputData}>
                        <div className={classes.inputDataWrapper}>
                            <input className={passwordState.length > 0 ? classes.hasValue : ""} type="password" value={passwordState} onChange={(e) => setPasswordState(e.target.value)}/>
                            <label>Password</label>
                            <div className={classes.toggleVisibility}></div>
                        </div>
                    </div>
                    <div className={classes.submit}>
                        <div className={classes.submitWrapper}><input type="submit" value="Submit" /></div>
                    </div>
                </form>
                <h3 className={classes.error}>{error}</h3>
            </div>
            <div className={classes.registerNavigation}>
                <h1>New here?</h1>
                <p>Sign up and discover a great amount of new opportunities!</p>
                <Link to="/register">
                    <div className={classes.submit}>
                        <div className={classes.submitWrapper}><input type="submit" value="Register" /></div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

export default LoginSite;
