import classes from './styles/InputField.module.scss'
import React from 'react'
import show from '../../assets/show.svg'
import hide from '../../assets/hide.svg'

export default function InputField({children, showPasswordClickCallback, showPassword, hasValue, error}) {
    return (
        <div className={classes.inputDataWrapper}>
            <div className={`${classes.inputData} ${hasValue ? classes.hasValue : ""} ${error ? classes.error : ""}`}>
                {children}
                {showPasswordClickCallback && 
                    <div className={classes.showPassword} onClick={showPasswordClickCallback}>
                        <img width="30px" height="30px" src={showPassword ? hide : show} alt="show hide" />
                    </div>
                }
            </div>
        </div>
    )
}
