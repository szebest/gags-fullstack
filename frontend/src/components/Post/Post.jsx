import classes from './styles/Post.module.scss'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSelector } from 'react-redux'

function Post({ _id, title, author, section, imgSrc, likes, dislikes, alreadyLiked }) {
    const [loaded, setLoaded] = useState(false)
    const [likesState, setLikesState] = useState(likes)
    const [dislikesState, setDisLikesState] = useState(dislikes)
    const [buttonClicked, setButtonClicked] = useState(alreadyLiked)
    const [actionLike, setActionLike] = useState('none')
    const [actionDisLike, setActionDisLike] = useState('none')
    const hasAccess = useSelector(state => state.hasAccess)

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
                //setButtonClicked(null)
                //setLikesState(prev => prev - sendLikes)
                //setDisLikesState(prev => prev - sendDisLikes)
            })
        }
    }, [likesState, dislikesState])

    const handleButtonClick = which => {
        if (!hasAccess) return
        if (which === 'like') {
            if (buttonClicked === which) {
                setButtonClicked(null)
                setLikesState(prev => prev - 1)
                setActionLike('remove')
                setActionDisLike('none')
            }
            else if (buttonClicked) {
                setButtonClicked(which)
                setLikesState(prev => prev + 1)
                setDisLikesState(prev => prev - 1)
                setActionLike('add')
                setActionDisLike('remove')
            }
            else {
                setButtonClicked(which)
                setLikesState(prev => prev + 1)
                setActionLike('add')
                setActionDisLike('none')
            }
        }
        else {
            if (buttonClicked === which) {
                setButtonClicked(null)
                setDisLikesState(prev => prev - 1)
                setActionDisLike('remove')
                setActionLike('none')
            }
            else if (buttonClicked) {
                setButtonClicked(which)
                setDisLikesState(prev => prev + 1)
                setLikesState(prev => prev - 1)
                setActionDisLike('add')
                setActionLike('remove')
            }
            else {
                setButtonClicked(which)
                setDisLikesState(prev => prev + 1)
                setActionDisLike('add')
                setActionLike('none')
            }
        }
    }

    return (
        <div className={classes.postWrapper}>
            <div className={classes.center}>
                <h2>{title}</h2>
            </div>
            <div className={classes.center}>
                <h6>Posted in {section} by {author}</h6>
            </div>
            <div className={classes.imageContainer}>
                <img hidden={!loaded} onLoad={() => setLoaded(true)} src={imgSrc} className={classes.image} />
            </div>
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
