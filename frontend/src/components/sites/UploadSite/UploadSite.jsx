import classes from './styles/UploadSite.module.scss'
import { Redirect } from 'react-router-dom'
import Cookies from 'js-cookie'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'

function UploadSite() {
    const imageRef = useRef()
    const sectionRef = useRef()
    const [title, setTitle] = useState("")
    const [fileSrc, setFileSrc] = useState("")
    const [redirect, setRedirect] = useState(false)
    const [submitClicked, setSubmitClicked] = useState(false)
    const [sections, setSections] = useState([])
    const hasAccess = useSelector(state => state.hasAccess)

    useEffect(() => {
        let cancel
        axios.get('http://localhost:3001/sections', {
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

            if (title.length === 0 || imageRef.current.files[0] === undefined) {
                setSubmitClicked(false)
                return
            }

            const form = new FormData()

            form.append("title", title)
            form.append("section", sectionRef.current.value)
            form.append("file", imageRef.current.files[0])

            axios({
                method: "POST",
                url: "http://localhost:3001/upload",
                data: form,
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${Cookies.get("accessToken")}`
                }
            })
            .then(res => {
                console.log(res.data)
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
        <div className={classes.uploadSiteWrapper}>
            <div className={classes.imagePreview}>
                <h2>{title}</h2>
                <img src={fileSrc} alt="image preview" hidden={fileSrc.length === 0} />
            </div>
            <div className={classes.formContainer}>
                <form className={classes.form} onSubmit={HandleSubmit}>
                    <input type="text" placeholder="" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <select ref={sectionRef}>
                        {sections && sections.map((section, index) => 
                            <option key={section}>{section}</option>
                        )}
                    </select>
                    <input ref={imageRef} type="file" accept=".jpg,.png" onChange={handleImageChange} />
                    <input type="submit" value="Submit" disabled={submitClicked} />

                </form>
            </div>
        </div>
    );
}

export default UploadSite;
