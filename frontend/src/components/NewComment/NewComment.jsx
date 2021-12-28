import classes from './styles/NewComment.module.scss'
import React, {useState} from 'react'

export default function NewComment({sendComment, parentComment, children}) {
    const [textEntered, setTextEntered] = useState("")

    function prepareComment() {
        var onlySpaces = true
        textEntered.split('').forEach((char) => {
            if (char !== ' ') onlySpaces = false
        })

        if (textEntered !== "" && !onlySpaces) {
            sendComment(textEntered, parentComment)
        }
        
        setTextEntered("")
    }

    return (
        <div className={classes.newComment}>
            <textarea value={textEntered} onChange={(e) => setTextEntered(e.target.value)} />
            <button onClick={prepareComment}>Comment</button>
            {children}
        </div>
    )
}
