import classes from './styles/LoginSite.module.scss'
import { useState } from 'react'
import axios from 'axios'
import { Redirect, Link } from 'react-router-dom'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'
import SendButton from '../../SendButton/SendButton'
import InputField from '../../InputField/InputField'

function LoginSite() {
    const queryParam = new URLSearchParams(document.location.search).get("username")
    const [usernameState, setUsernameState] = useState(queryParam ? queryParam : "")
    const [passwordState, setPasswordState] = useState("")
    const [error, setError] = useState("")
    const [, setLoading] = useState(false)
    const hasAccess = useSelector(state => state.hasAccess)
    const [showPassword, setShowPassword] = useState(false)

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
                    <InputField hasValue={usernameState.length > 0}>
                        <input className={usernameState.length > 0 ? classes.hasValue : ""} type="text" value={usernameState} onChange={(e) => setUsernameState(e.target.value)}/>
                        <label>Username</label>
                    </InputField>
                    <InputField showPasswordClickCallback={() => setShowPassword(prev => !prev)} showPassword={showPassword} hasValue={passwordState.length > 0}>
                        <input type={showPassword ? "text" : "password"} value={passwordState} onChange={(e) => setPasswordState(e.target.value)}/>
                        <label>Password</label>
                    </InputField>
                    <SendButton>
                        <input type="submit" value="Submit" />
                    </SendButton>
                </form>
                <h3 className={classes.error}>{error}</h3>
            </div>
            <div className={classes.registerNavigation}>
                <h1>New here?</h1>
                <p>Sign up and discover a great amount of new opportunities!</p>
                <SendButton>
                    <Link to="/register">
                        <input type="submit" value="Register" />
                    </Link>
                </SendButton>
            </div>
        </div>
    );
}

export default LoginSite;
