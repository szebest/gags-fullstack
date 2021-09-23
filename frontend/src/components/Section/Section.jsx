import classes from './styles/Section.module.scss'
import { Redirect } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Section({ name }) {
    const [clicked, setClicked] = useState(false)

    useEffect(() => {
        setClicked(false)
    })

    if (clicked)
        return <Redirect to={`/section/${name}`} />
    return (
        <div className={classes.sectionWrapper} onClick={() => setClicked(true)}>
            <p>{name}</p>
        </div>
    );
}

export default Section;
