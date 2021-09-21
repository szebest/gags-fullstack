import classes from './styles/PostsContainer.module.scss'
import Post from '../Post/Post';
import { useEffect, useRef } from 'react'
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'

function PostsContainer({posts, callForMore}) {
    const observeRef = useRef()
    const isVisible = useIsVisible(observeRef)

    useEffect(() => {
        if (callForMore && isVisible) {
            console.log("MORE")
            callForMore()
        }
    }, [isVisible])

    return (
        <>
            {posts.map((post) => {
                return <Post 
                    _id={post._id}
                    key={post._id} 
                    title={post.title}
                    author={post.author}
                    section={post.section}
                    imgSrc={post.imgSrc} 
                    likes={post.likes} 
                    dislikes={post.dislikes}
                    alreadyLiked={post.actionType}
                    />
            }
            )}
            <div className={classes.observer} ref={observeRef} >
                
            </div>
        </>
    );
}

export default PostsContainer;
