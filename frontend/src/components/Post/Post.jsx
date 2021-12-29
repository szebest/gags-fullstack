import classes from './styles/Post.module.scss'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'

function Post({ _id, title, author, section, imgSrc, likes, dislikes, alreadyLiked, saveInLS }) {
    const [loaded, setLoaded] = useState(false)
    const [likesState, setLikesState] = useState(likes)
    const [dislikesState, setDisLikesState] = useState(dislikes)
    const [buttonClicked, setButtonClicked] = useState(alreadyLiked)
    const [actionLike, setActionLike] = useState('none')
    const [actionDisLike, setActionDisLike] = useState('none')
    const hasAccess = useSelector(state => state.hasAccess)
    const imageRef = useRef()

    const { sectionName } = useParams()

    const handleClick = () => {
        localStorage.setItem('scrollY', window.scrollY)
    }

    useEffect(() => {
        if (hasAccess !== undefined && !hasAccess) setButtonClicked(null)
    }, [hasAccess])

    useEffect(() => {
        setButtonClicked(alreadyLiked)
    }, [alreadyLiked])

    useEffect(() => {
        if (loaded) {
            const sendLikes = actionLike === 'none' ? 0 : (actionLike === 'add' ? 1 : -1)
            const sendDisLikes = actionDisLike === 'none' ? 0 : (actionDisLike === 'add' ? 1 : -1)

            axios({
                method: "PATCH",
                url: `http://localhost:3001/posts/${_id}`,
                params: new URLSearchParams({
                    like: sendLikes,
                    dislike: sendDisLikes
                }),
                headers: { 
                    Authorization: `Bearer ${Cookies.get("accessToken")}`
                }
            })
            .then(res => {
                console.log(res)
            })
            .catch(err => {
                console.error(err)
            })
        }
    }, [likesState, dislikesState])

    console.log(buttonClicked)

    if (saveInLS === undefined) {
        const saved = localStorage.getItem('postAction')

        if (saved !== null) {
            const obj = JSON.parse(saved)
            if (obj.postId.toString() === _id.toString()) {
                const action = obj.actionType
                setButtonClicked(action)
                if (action === 'like') setActionLike(action)
                else if (action === 'dislike') setActionDisLike(action)
                else {
                    setActionDisLike(action)
                    setActionLike(action)
                }

                localStorage.removeItem('postAction')
            }
        }
    }

    const handleButtonClick = which => {
        if (!hasAccess) return
        if (which === 'like') {
            if (buttonClicked === which) {
                setButtonClicked(null)
                setLikesState(prev => prev - 1)
                setActionLike('remove')
                setActionDisLike('none')
                localStorage.setItem('postAction', JSON.stringify({
                    postId: _id,
                    actionType: 'none'
                }))

            }
            else if (buttonClicked) {
                setButtonClicked(which)
                setLikesState(prev => prev + 1)
                setDisLikesState(prev => prev - 1)
                setActionLike('add')
                setActionDisLike('remove')
                localStorage.setItem('postAction', JSON.stringify({
                    postId: _id,
                    actionType: 'like'
                }))
            }
            else {
                setButtonClicked(which)
                setLikesState(prev => prev + 1)
                setActionLike('add')
                setActionDisLike('none')
                localStorage.setItem('postAction', JSON.stringify({
                    postId: _id,
                    actionType: 'like'
                }))
            }
        }
        else {
            if (buttonClicked === which) {
                setButtonClicked(null)
                setDisLikesState(prev => prev - 1)
                setActionDisLike('remove')
                setActionLike('none')
                localStorage.setItem('postAction', JSON.stringify({
                    postId: _id,
                    actionType: 'none'
                }))
            }
            else if (buttonClicked) {
                setButtonClicked(which)
                setDisLikesState(prev => prev + 1)
                setLikesState(prev => prev - 1)
                setActionDisLike('add')
                setActionLike('remove')
                localStorage.setItem('postAction', JSON.stringify({
                    postId: _id,
                    actionType: 'dislike'
                }))
            }
            else {
                setButtonClicked(which)
                setDisLikesState(prev => prev + 1)
                setActionDisLike('add')
                setActionLike('none')
                localStorage.setItem('postAction', JSON.stringify({
                    postId: _id,
                    actionType: 'dislike'
                }))
            }
        }
    }

    return (
        <div className={classes.postWrapper}>
            <Link to={`/post/${_id}`} onClick={handleClick}>
                <div className={classes.center}>
                    <h2>{title}</h2>
                </div>
            </Link>
            <div className={classes.center}>
                <h6>Posted in {section} by {author}</h6>
            </div>
            <Link to={sectionName === undefined ? `/post/${_id}` : `/section/${sectionName}/post/${_id}`} onClick={handleClick}>
                <div className={`${classes.imageContainer} ${loaded ? "" : classes.minHeight}`}>
                    <img ref={imageRef} onLoad={() => setLoaded(true)} style={{height: imageRef.current && !loaded ? imageRef.current.naturalHeight + "px" : "inherit"}} src={imgSrc} className={classes.image} />
                </div>
            </Link>
            <div className={classes.statistics}>
                <div className={buttonClicked === 'like' ? classes.clicked : ""} onClick={() => handleButtonClick("like")}>
                    <p>▲</p>
                    <p>{likesState}</p>
                </div>
                <div className={buttonClicked === 'dislike' ? classes.clicked : ""} onClick={() => handleButtonClick("dislike")}>
                    <p>▼</p>
                    <p>{dislikesState}</p>
                </div>
            </div>
        </div>
    );
}

export default Post;
