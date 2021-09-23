import classes from './styles/RegisterSite.module.scss'
import { useRef, useState } from 'react';
import axios from 'axios';
import { Redirect } from 'react-router';
import { useSelector } from 'react-redux'

function RegisterSite() {
    const usernameRef = useRef()
    const passwordRef = useRef()
    const confirmPasswordRef = useRef()
    const imageRef = useRef()
    const [error, setError] = useState([])
    const [redirect, setRedirect] = useState(false)
    const [fileSrc, setFileSrc] = useState("")
    const hasAccess = useSelector(state => state.hasAccess)

    if (hasAccess !== null && hasAccess)
        return <Redirect to="/" />

    if (redirect)
        return <Redirect to={`/login?username=${usernameRef.current.value}`} />

    const handleSubmit = (e) => {
        e.preventDefault()
        const username = usernameRef.current.value
        const password = passwordRef.current.value
        const confirmPassword = confirmPasswordRef.current.value
        const file = imageRef.current.files[0] ? imageRef.current.files[0].name : ""
        const errors = []

        if (username.length < 4)
            errors.push("Username has to be at least 4 characters long")
        else if (username.length > 15)
            errors.push("Username has to be shorter than 15 characters")

        if (password.length < 4)
            errors.push("Password has to be at least 6 characters long")
        else if (password.length > 15)
            errors.push("Password has to be shorter than 30 characters")
        
        if (password !== confirmPassword)
            errors.push("Passwords do not match")
        
        if (file.length === 0)
            errors.push("Provide your profile picture")
        
        const extension = file.split('.')[1]
        if (!(file && (extension === 'jpg' || extension === 'png')))
            errors.push("Profile picture must have an .jpg or .png extension")

        const form = new FormData()

        form.append("username", username)
        form.append("password", password)
        form.append("file", imageRef.current.files[0])

        //Successfully filled out form, no errors
        if (errors.length === 0) {
            axios({
                method: "POST",
                url: "http://localhost:3001/register",
                data: form,
                headers: { "Content-Type": "multipart/form-data" }
            })
            .then(res => {
                setRedirect(true)
            })
            .catch(err => {
                //setError([err])
            })
        }
        else {
            setError(errors)
        }
    }

    const handleImageChange = () => {
        const fileName = imageRef.current.files[0] ? imageRef.current.files[0].name : ""
        const extension = fileName.split('.')[1]
        if (fileName && (extension === 'jpg' || extension === 'png')) {
            const filePath = URL.createObjectURL(imageRef.current.files[0])

            if (filePath) {
                setFileSrc(filePath)
                return
            }
        }
        setFileSrc("")
    }

    if (hasAccess === null) 
        return (
            <>
            </>
        )

    return (
        <div className={classes.registerSiteWrapper}>
            <div className={classes.errorContainer}>
                {error.map((err, index) => 
                    <div key={index}>
                        <center><p>{err}</p></center>
                    </div>
                )}
            </div>
            <form onSubmit={handleSubmit} className={classes.registerSiteForm}>
                <input ref={usernameRef} type="text" placeholder="Username" />
                <input ref={passwordRef} type="password" placeholder="Password" />
                <input ref={confirmPasswordRef} type="password" placeholder="Confirm password" />
                <div>
                    {fileSrc.length > 0 && 
                    <img height="48"
                        width="48"
                        src={fileSrc} 
                        alt="your image"
                        className={classes.profile} />}
                    <input ref={imageRef} type="file" accept=".jpg,.png" onChange={handleImageChange} />
                </div>
                <input type="submit" value="Submit" />
            </form>
        </div>
    );
}

export default RegisterSite;
