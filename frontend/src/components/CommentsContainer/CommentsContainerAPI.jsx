import React from 'react'

export default function CommentsContainerAPI() {
    return (
        <div className={classes.commentsContainerWrapper}>
            <PostsContainer updatePost={updatePost} posts={posts} callForMore={sendRequest} sectionName={postsAvailable ? sectionName : ""} />
        </div>
    )
}
