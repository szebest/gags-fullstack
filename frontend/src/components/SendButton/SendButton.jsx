import classes from './styles/SendButton.module.scss'
import React from 'react'

export default function SendButton({ children }) {
    return (
        <div className={classes.sendButtonWrapper}>
            <div className={classes.sendButton}>
                {children}
            </div>
        </div>
    )
}
