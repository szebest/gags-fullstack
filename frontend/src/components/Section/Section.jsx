import classes from './styles/Section.module.scss'
import { Redirect } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

function Section({ name }) {
    const [clicked, setClicked] = useState(false)
    const { sectionName } = useParams()

    useEffect(() => {
        setClicked(false)
    })

    if (clicked)
        return <Redirect to={`/section/${name}`} />
    return (
        <div className={`${classes.sectionWrapper} ${sectionName === name ? classes.active : ""}`} onClick={() => setClicked(true)}>
            <p>{name}</p>
        </div>
    );
}

export default Section;
