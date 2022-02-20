import classes from './styles/FileInput.module.scss'
import React from 'react'

export default function FileInput({children}) {
    return (
        <div className={classes.fileInputWrapper}>
            {children}
        </div>
    )
}
