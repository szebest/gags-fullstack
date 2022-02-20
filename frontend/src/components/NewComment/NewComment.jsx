import classes from './styles/NewComment.module.scss'
import React, {useState} from 'react'
import SendButton from '../SendButton/SendButton'

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
            <SendButton>
                <input type="submit" value="Comment" onClick={prepareComment} />
            </SendButton>
            {children}
        </div>
    )
}
