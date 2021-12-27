import classes from './styles/PostSite.module.scss'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import axios from 'axios'

export default function PostSite() {
    const { postID } = useParams()

    useEffect(() => {
        let cancel
        axios.get(`http://localhost:3001/posts/${postID}`, {
            cancelToken: new axios.CancelToken(c => cancel = c)
        })
        .then(res => {
            console.log(res.data)
        })

        return () => cancel()
    }, [])

    return (
        <div className={classes.huge}>
            sfg
        </div>
    )
}
