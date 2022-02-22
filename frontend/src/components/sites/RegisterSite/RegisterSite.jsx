import classes from './styles/RegisterSite.module.scss'
import { useRef, useState } from 'react';
import axios from 'axios';
import { Link, Redirect } from 'react-router-dom';
import { useSelector } from 'react-redux'
import SendButton from '../../SendButton/SendButton'
import InputField from '../../InputField/InputField'
import FileInput from '../../FileInput/FileInput'

function RegisterSite() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const imageRef = useRef()
    const [error, setError] = useState({ username: "", password: "", confirm: "", file: "" })
    const [redirect, setRedirect] = useState(false)
    const [fileSrc, setFileSrc] = useState("")
    const [fileName, setFileName] = useState("")
    const hasAccess = useSelector(state => state.hasAccess)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    if (hasAccess !== null && hasAccess)
        return <Redirect to="/" />

    if (redirect)
        return <Redirect to={`/login?username=${username}`} />

    const handleSubmit = (e) => {
        e.preventDefault()
        const file = (fileName.length > 0 && imageRef.current.files[0]) ? imageRef.current.files[0].name : ""
        const errors = { username: "", password: "", confirm: "", file: "" }

        if (username.length < 4)
            errors.username = "Username has to be at least 4 characters long"
        else if (username.length > 30)
            errors.username = "Username has to be shorter than 30 characters"

        if (password.length < 4)
            errors.password = "Password has to be at least 6 characters long"
        else if (password.length > 30)
            errors.password = "Password has to be shorter than 30 characters"

        if (password !== confirmPassword)
            errors.confirm = "Passwords do not match"

        const extension = file.split('.')[1]
        if (!(file && (extension === 'jpg' || extension === 'png')))
            errors.file = "Profile picture must have an .jpg or .png extension"

        if (file.length === 0)
            errors.file = "Provide your profile picture"

        setError(errors)

        if (errors.username.length > 0 || errors.password.length > 0 || errors.confirm.length > 0 || errors.file.length > 0) return

        const form = new FormData()

        form.append("username", username)
        form.append("password", password)
        form.append("file", imageRef.current.files[0])

        setSubmitted(true)

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
                setError(prev => {return {...prev, username: "This username is taken, please choose another one!"}})
            })
            .finally(() => {
                setSubmitted(false)
            })
    }

    const handleImageChange = () => {
        const fileName = imageRef.current.files[0] ? imageRef.current.files[0].name : ""
        const extension = fileName.split('.')[1]
        if (fileName && (extension === 'jpg' || extension === 'png')) {
            const filePath = URL.createObjectURL(imageRef.current.files[0])

            if (filePath) {
                setFileName(imageRef.current.files[0].name.split('\\').pop().split('/').pop())
                setFileSrc(filePath)
                return
            }
        }
    }

    const handleImageError = () => {
        setFileSrc("")
        setFileName("")
        setError(prev => { return {...prev, file: "Provide a valid image file!"} })
    }

    if (hasAccess === null)
        return (
            <>
            </>
        )

    return (
        <div className={classes.registerSiteWrapper}>
            <div className={classes.mainContent}>
                <h1>Create an account</h1>
                <form onSubmit={handleSubmit} className={classes.registerSiteForm}>
                    <InputField error={error.username.length > 0} hasValue={username.length > 0}>
                        <input onChange={(e) => setUsername(e.target.value)} type="text" />
                        <label>Username</label>
                    </InputField>
                    <div className={classes.error}>{error.username}</div>
                    <InputField showPasswordClickCallback={() => setShowPassword(prev => !prev)} showPassword={showPassword} error={error.password.length > 0} hasValue={password.length > 0}>
                        <input onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} />
                        <label>Password</label>
                    </InputField>
                    <div className={classes.error}>{error.password}</div>
                    <InputField showPasswordClickCallback={() => setShowConfirmPassword(prev => !prev)} showPassword={showConfirmPassword} error={error.confirm.length > 0} hasValue={confirmPassword.length > 0}>
                        <input onChange={(e) => setConfirmPassword(e.target.value)} type={showConfirmPassword ? "text" : "password"} />
                        <label>Confirm password</label>
                    </InputField>
                    <div className={classes.error}>{error.confirm}</div>
                    <FileInput>
                        {fileSrc.length > 0 &&
                            <img height="80"
                                width="80"
                                src={fileSrc}
                                alt="profile picture"
                                onLoad={() => setError(prev => { return {...prev, file: ""} })}
                                onError={handleImageError}
                                className={classes.profile} />}
                        <input ref={imageRef} type="file" name="file" id="file" accept=".jpg,.png" onChange={handleImageChange} />
                        <label htmlFor="file">{fileName.length === 0 ? "Choose a profile picture" : fileName}</label>
                    </FileInput>
                    <div className={classes.error}>{error.file}</div>
                    <SendButton>
                        <input type="submit" value="Submit" disabled={submitted} />
                    </SendButton>
                </form>
            </div>
            <div className={classes.loginNavigation}>
                <h1>Already have an account?</h1>
                <p>Click here to log in!</p>
                <SendButton>
                    <Link to="/login">
                        <input type="submit" value="Login" />
                    </Link>
                </SendButton>
            </div>
        </div>
    );
}

export default RegisterSite;
