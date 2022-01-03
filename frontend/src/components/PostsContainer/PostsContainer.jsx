import classes from './styles/PostsContainer.module.scss'
import Post from '../Post/Post';
import { useEffect, useRef } from 'react'
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'

function PostsContainer({posts, callForMore, sectionName, ready, updatePost}) {
    const observeRef = useRef()
    const isVisible = useIsVisible(observeRef)
    const first = useRef(true)

    useEffect(() => {
        if (isVisible && (ready !== undefined && ready || ready === undefined)) {
            first.current = false
            callForMore()
        }
    }, [isVisible, sectionName, ready])

    useEffect(() => {
        setTimeout(() => {if (first.current) callForMore()}, 1000)
    }, [])

    return (
        <div className={classes.limitSpace}>
            {posts.map((post, index) => {
                return <Post 
                    key={post._id}
                    post={post}
                    updatePost={updatePost}
                    index={index}
                    sectionURL={sectionName}
                    />
            }
            )}
            <div className={classes.observer} ref={observeRef} >
                
            </div>
        </div>
    );
}

export default PostsContainer;
