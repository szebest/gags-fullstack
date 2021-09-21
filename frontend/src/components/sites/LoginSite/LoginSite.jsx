import classes from './styles/LoginSite.module.scss'
import { useRef, useState } from 'react'
import axios from 'axios'
import { Redirect } from 'react-router-dom'
import Cookies from 'js-cookie'

function LoginSite({ hasAccess }) {
    const queryParam = new URLSearchParams(document.location.search).get("username")
    const [usernameState, setUsernameState] = useState(queryParam ? queryParam : "")
    const passwordRef = useRef()
    const [error, setError] = useState("")
    const [, setLoading] = useState(false)

    if (hasAccess !== undefined && hasAccess)
        return <Redirect to="/" />

    const handleSubmit = (e) => {
        e.preventDefault()

        setError("")
        setLoading(true)

        axios.post('http://localhost:3001/login', {
            username: usernameState,
            password: passwordRef.current.value
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

    return (
        <div className={classes.loginSiteWrapper}>
            <form className={classes.loginSiteForm} onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" value={usernameState} onChange={(e) => setUsernameState(e.target.value)} />
                <input ref={passwordRef} type="password" placeholder="Password" defaultValue="" />
                <input type="submit" value="Submit" />
            </form>
            <h3 className={classes.error}>{error}</h3>
        </div>
    );
}

export default LoginSite;
