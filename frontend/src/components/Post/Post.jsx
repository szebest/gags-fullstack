import classes from './styles/Post.module.scss'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'

function Post({ post, saveInLS, updatePost, index }) {
    const [loaded, setLoaded] = useState(false)
    const [action, setAction] = useState({
        like: post.actionType === 'like' ? 1 : 0,
        dislike: post.actionType === 'dislike' ? 1 : 0
    })
    const [tmpAction, tmpSetAction] = useState(action)
    const hasAccess = useSelector(state => state.hasAccess)
    const imageRef = useRef()

    const { sectionName } = useParams()

    useEffect(() => {
        if (!post._id) return

        const like = action.like - tmpAction.like
        const dislike = action.dislike - tmpAction.dislike

        tmpSetAction({...action})

        if (like === 0 && dislike === 0) return

        axios.patch(`http://localhost:3001/posts/${post._id}`, {
            like, dislike
        }, {
            headers: {
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            /*if (saveInLS) localStorage.setItem('postAction', JSON.stringify({
                postId: res.data.updatedPost._id,
                actionType: res.data.updatedPost.actionType
            }))*/

            updatePost(res.data.updatedPost, index)
        })
        .catch(err => {
            console.log(err)
        })
    }, [action])

    /*if (saveInLS === undefined) {
        const saved = localStorage.getItem('postAction')

        if (saved !== null) {
            const obj = JSON.parse(saved)
            if (obj.postId.toString() === post._id.toString()) {
                const action = obj.actionType
                setAction({
                    like: action === 'like' ? 1 : 1,
                    dislike: action === 'dislike' ? 1 : 0
                })

                localStorage.removeItem('postAction')
            }
        }
    }*/

    function like() {
        if (!hasAccess) return

        const tmpState = action
        tmpState.dislike = 0
        tmpState.like = tmpState.like === 0 ? 1 : 0

        setAction({...tmpState})
    }

    function dislike() {
        if (!hasAccess) return
        
        const tmpState = action
        tmpState.like = 0
        tmpState.dislike = tmpState.dislike === 0 ? 1 : 0

        setAction({...tmpState})
    }

    return (
        <div className={classes.postWrapper}>
            <Link to={`/post/${post._id}`}>
                <div className={classes.center}>
                    <h2>{post.title}</h2>
                </div>
            </Link>
            <div className={classes.center}>
                <h6>Posted in {post.section} by {post.author}</h6>
            </div>
            <Link to={sectionName === undefined ? `/post/${post._id}` : `/section/${sectionName}/post/${post._id}`}>
                <div className={`${classes.imageContainer} ${loaded ? "" : classes.minHeight}`}>
                    <img ref={imageRef} onLoad={() => setLoaded(true)} style={{height: imageRef.current && !loaded ? imageRef.current.naturalHeight + "px" : "inherit"}} src={post.imgSrc} className={classes.image} />
                </div>
            </Link>
            <div className={classes.statistics}>
                <div className={action.like ? classes.clicked : ""} onClick={like}>
                    <p>▲</p>
                    <p>{post.likes}</p>
                </div>
                <div className={action.dislike ? classes.clicked : ""} onClick={dislike}>
                    <p>▼</p>
                    <p>{post.dislikes}</p>
                </div>
            </div>
        </div>
    );
}

export default Post;
