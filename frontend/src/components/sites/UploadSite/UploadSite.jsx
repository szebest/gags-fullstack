import classes from './styles/UploadSite.module.scss'
import { Redirect } from 'react-router-dom'
import Cookies from 'js-cookie'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import SendButton from '../../SendButton/SendButton'
import InputField from '../../InputField/InputField'
import FileInput from '../../FileInput/FileInput'

function UploadSite() {
    const imageRef = useRef()
    const sectionRef = useRef()
    const [title, setTitle] = useState("")
    const [fileSrc, setFileSrc] = useState("")
    const [fileName, setFileName] = useState("")
    const [redirect, setRedirect] = useState(false)
    const [submitClicked, setSubmitClicked] = useState(false)
    const [sections, setSections] = useState([])
    const hasAccess = useSelector(state => state.hasAccess)
    const [error, setError] = useState({ title: "", file: "" })

    useEffect(() => {
        let cancel
        axios.get('https://gags-backend.herokuapp.com/sections', {
            cancelToken: new axios.CancelToken(c => cancel = c)
        })
        .then(res => {
            setSections(res.data.sections)
        })

        return () => cancel()
    }, [])

    if ((hasAccess !== null && !hasAccess) || redirect)
        return <Redirect to="/" />

    const HandleSubmit = async (e) => {
        e.preventDefault()

        if (hasAccess) {
            setSubmitClicked(true)

            const errors = { title: "", file: "" }

            if (fileName.length === 0)
                errors.file = "Provide an image"

            if (title.length === 0) 
                errors.title = "Provide an title for the image"

            setError(errors)

            if (errors.title.length > 0 || errors.file.length > 0) {
                setSubmitClicked(false)
                return
            }

            const form = new FormData()

            form.append("title", title)
            form.append("section", sectionRef.current.value)
            form.append("file", imageRef.current.files[0])

            axios({
                method: "POST",
                url: "https://gags-backend.herokuapp.com/upload",
                data: form,
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${Cookies.get("accessToken")}`
                }
            })
            .then(res => {
                setRedirect(true)
            })
            .catch(err => {
                setSubmitClicked(false)
            })
        }
    }

    const handleImageChange = () => {
        const fileName = imageRef.current.files[0] ? imageRef.current.files[0].name : ""
        const extension = fileName.split('.')[1]
        if (fileName && (extension === 'jpg' || extension === 'png' || extension === 'gif')) {
            const filePath = URL.createObjectURL(imageRef.current.files[0])

            if (filePath) {
                setFileSrc(filePath)
                setFileName(imageRef.current.files[0].name.split('\\').pop().split('/').pop())
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
        <div className={classes.uploadSiteWrapper}>
            <div className={classes.imagePreview}>
                <h2 className={classes.minHeight}>{title}</h2>
                {fileSrc.length > 0 && <img src={fileSrc} alt="image preview" hidden={fileSrc.length === 0} onError={handleImageError} />}
            </div>
            <div className={classes.formContainer}>
                <form className={classes.form} onSubmit={HandleSubmit}>
                    <InputField hasValue={title.length > 0}>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}/>
                        <label>Post title</label>
                    </InputField>
                    <div className={classes.error}>{error.title}</div>
                    <div className={classes.selectData}>
                        <label>Category</label>
                        <select ref={sectionRef}>
                            {sections && sections.map((section, index) => 
                                <option key={section}>{section}</option>
                            )}
                        </select>
                    </div>
                    <FileInput>
                        <input ref={imageRef} type="file" name="file" id="file" accept=".jpg,.png,.gif" onChange={handleImageChange} />
                        <label htmlFor="file">{fileName.length === 0 ? "Choose an image" : fileName}</label>
                    </FileInput>
                    <div className={classes.error}>{error.file}</div>
                    <SendButton>
                        <input type="submit" value="Submit" disabled={submitClicked} />
                    </SendButton>
                </form>
            </div>
        </div>
    );
}

export default UploadSite;
