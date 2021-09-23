import Header from './components/Header/Header'
import MainSite from './components/sites/MainSite/MainSite.jsx'
import LoginSite from './components/sites/LoginSite/LoginSite.jsx'
import RegisterSite from './components/sites/RegisterSite/RegisterSite'
import UploadSite from './components/sites/UploadSite/UploadSite'
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom"
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'
import ProfileSite from './components/sites/ProfileSite/ProfileSite'
import { useDispatch } from 'react-redux'
import { setHasAccess } from './actions'

function App() {
    const [accessToken, setAccessToken] = useState()
    const dispatch = useDispatch()

    const sendRefreshRequest = () => {
        axios.post('http://localhost:3001/refresh', {
            refreshToken: Cookies.get('refreshToken')
        })
        .then(res => {
            if (res.data.accessToken) {
                Cookies.set('accessToken', res.data.accessToken)
            }
        })
        .catch(err => {
            //Error, force logout
            Cookies.set('accessToken', undefined)
            Cookies.set('refreshToken', undefined)
            Cookies.set('expiresIn', undefined)
        })
    }

    useEffect(() => {
        if (window.location.pathname === '/' && Cookies.get("refreshToken") !== 'undefined') {
            if (window.performance)
                if (performance.navigation && performance.navigation.type !== 1)
                    sendRefreshRequest()
            else {
                const navigationType = performance.getEntriesByType("navigation")[0]
                if (navigationType && navigationType.type !== 'reload')
                    sendRefreshRequest()
        }
        }

        const id = setInterval(() => {
            setAccessToken(Cookies.get('accessToken'))
        }, 250)

        return () => {
            clearInterval(id)
        }
    }, [])

    useEffect(() => {
        let id
        if (accessToken !== undefined) {
            const str = Cookies.get('expiresIn')
            if (str !== 'undefined') {
                const number = parseInt(str, 10)
                const unit = str.substr(number.toString().length)
                const multiplier = unit === 's' ? 1000 :
                                unit === 'm' ?  1000 * 60 :
                                unit === 'd' ? 1000 * 60 * 24 : 1000
                const displacementScale = 0.75
                id = setTimeout(() => {
                    sendRefreshRequest()
                }, number * multiplier * displacementScale)
            }
        }

        return () => {
            clearTimeout(id)
        }
    }, [accessToken])

    useEffect(() => {
        if (accessToken !== undefined) {
            axios.post('http://localhost:3001/hasAccess', {
                accessToken: Cookies.get('accessToken')
            })
            .then(res => {
                dispatch(setHasAccess(res.data.access))
            })
            .catch(err => {
                //Error, force logout
                console.log("ERROR LOGOUT")
                Cookies.set('accessToken', undefined)
                Cookies.set('refreshToken', undefined)
                Cookies.set('expiresIn', undefined)
            })
        }
    }, [accessToken])

    return (
        <Router>
            <Header />
            <Switch>
                <Route exact path="/">
                    <MainSite />
                </Route>
                <Route exact path="/section/:sectionName">
                    <MainSite />
                </Route>
                <Route exact path="/login">
                    <LoginSite />
                </Route>
                <Route exact path="/register">
                    <RegisterSite />
                </Route>
                <Route exact path="/upload">
                    <UploadSite />
                </Route>
                <Route exact path="/profile">
                    <ProfileSite />
                </Route>
            </Switch>
        </Router>
    );
}

export default App;
