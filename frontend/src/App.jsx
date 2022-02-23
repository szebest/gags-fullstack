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
import PostModal from './components/PostModal/PostModal'
import AboutSite from './components/sites/AboutSite/AboutSite'

function App() {
    const [accessToken, setAccessToken] = useState()
    const dispatch = useDispatch()

    const sendRefreshRequest = () => {
        if (accessToken === undefined || accessToken === 'undefined') return

        axios.post('https://gags-backend.herokuapp.com/refresh', {
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
        const id = setInterval(() => {
            setAccessToken(Cookies.get('accessToken'))
        }, 250)

        return () => {
            clearInterval(id)
        }
    }, [])

    useEffect(() => {
        if (accessToken !== 'undefined' && accessToken !== undefined) {
            sendRefreshRequest()
            const str = Cookies.get('expiresIn')
            if (str !== undefined) {
                const number = parseInt(str, 10)
                const unit = str.substr(number.toString().length)
                const multiplier = unit === 's' ? 1000 :
                    unit === 'm' ? 1000 * 60 :
                        unit === 'd' ? 1000 * 60 * 24 : 1000
                const displacementScale = 0.75
                setTimeout(() => {
                    sendRefreshRequest()
                }, number * multiplier * displacementScale)
            }
        }
    }, [accessToken])

    useEffect(() => {
        if (accessToken !== undefined) {
            axios.post('https://gags-backend.herokuapp.com/hasAccess', {
                accessToken: Cookies.get('accessToken')
            })
            .then(res => {
                dispatch(setHasAccess(res.data.access))
            })
            .catch(err => {
                //Error, force logout
                Cookies.set('accessToken', undefined)
                Cookies.set('refreshToken', undefined)
                Cookies.set('expiresIn', undefined)
            })
        }
        else dispatch(setHasAccess(false))
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
                <Route exact path="/profile/:profileName">
                    <ProfileSite />
                </Route>
                <Route exact path="/post/:postID">
                    <MainSite />
                    <PostModal />
                </Route>
                <Route exact path="/section/:sectionName/post/:postID">
                    <MainSite />
                    <PostModal />
                </Route>
                <Route exact path="/profile/:profileName/post/:postID">
                    <ProfileSite />
                    <PostModal />
                </Route>
                <Route exact path="/about">
                    <AboutSite />
                </Route>
            </Switch>
        </Router>
    );
}

export default App;
