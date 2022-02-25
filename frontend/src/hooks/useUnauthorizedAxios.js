import axios from 'axios'

import baseURL from '../util/baseUrlPage'

const useAuthorizedAxios = () => {
    const axiosUnauthorizedInstance = axios.create({
        baseURL
    })

    return axiosUnauthorizedInstance
}

export default useAuthorizedAxios