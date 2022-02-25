import jwt_decode from 'jwt-decode'
import dayjs from 'dayjs'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useDispatch } from 'react-redux'

import { setHasAccess } from '../actions'

import baseURL from '../util/baseUrlPage'

const useAuthorizedAxios = (required = true) => {
    const dispatch = useDispatch()

    const accessToken = Cookies.get('accessToken')
    const refreshToken = Cookies.get('refreshToken')

    const axiosAuthorizedInstance = axios.create({
        baseURL,
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    axiosAuthorizedInstance.interceptors.request.use(async req => {
        if (!required && (accessToken === 'undefined' || accessToken === undefined)) return req

        const decodedJWT = jwt_decode(accessToken)
        const isExpired = dayjs.unix(decodedJWT.exp).diff(dayjs()) < 1

        if (!isExpired) return req

        const response = await axios.post(`${baseURL}/refresh`, {
            refreshToken
        })

        dispatch(setHasAccess(true))

        Cookies.set('accessToken', response.data.accessToken)

        req.headers.Authorization = `Bearer ${response.data.accessToken}`

        return req
    })

    return axiosAuthorizedInstance
}

export default useAuthorizedAxios