import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom"

import Header from './components/Header/Header'
import MainSite from './components/sites/MainSite/MainSite.jsx'
import LoginSite from './components/sites/LoginSite/LoginSite.jsx'
import RegisterSite from './components/sites/RegisterSite/RegisterSite'
import UploadSite from './components/sites/UploadSite/UploadSite'
import ProfileSite from './components/sites/ProfileSite/ProfileSite'
import PostModal from './components/PostModal/PostModal'
import AboutSite from './components/sites/AboutSite/AboutSite'

import { useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'

import { setHasAccess } from './actions'

import Cookies from "js-cookie"
import useAuthorizedAxios from "./hooks/useAuthorizedAxios"
import { useSelector } from "react-redux"

function App() {
    const [accessToken, setAccessToken] = useState()
    const dispatch = useDispatch()

    const hasAccess = useSelector(state => state.hasAccess)

    const authorizedAxios = useAuthorizedAxios()

    useEffect(() => {
        const id = setInterval(() => {
            setAccessToken(Cookies.get('accessToken'))
        }, 250)

        return () => {
            clearInterval(id)
        }
    }, [])

    useEffect(() => {
        authorizedAxios.post('/hasAccess')
            .then(res => {
                dispatch(setHasAccess(res.data.access))
            })
            .catch(err => {
                //Error, force logout
                dispatch(setHasAccess(false))
                Cookies.set('accessToken', undefined)
                Cookies.set('refreshToken', undefined)
                Cookies.set('expiresIn', undefined)
            })
    }, [accessToken])

    if (hasAccess === null) return null

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
