import classes from './styles/PostsContainer.module.scss'
import Post from '../Post/Post';
import { useEffect, useRef } from 'react'
import 'intersection-observer'
import { useIsVisible } from 'react-is-visible'
import { useParams } from 'react-router-dom'

function PostsContainer({posts, callForMore, sectionName, ready, updatePost}) {
    const observeRef = useRef()
    const isVisible = useIsVisible(observeRef)
    const first = useRef(true)
    const { postID } = useParams()

    useEffect(() => {
        if (postID === undefined && isVisible && (ready !== undefined && ready || ready === undefined)) {
            first.current = false
            callForMore()
        }
    }, [isVisible, sectionName, ready, postID])

    useEffect(() => {
        if (postID !== undefined) return

        setTimeout(() => {if (first.current) callForMore()}, 1000)
    }, [postID])

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
