import classes from './styles/Sections.module.scss'
import Section from '../Section/Section'
import { useState, useEffect } from 'react'
import axios from 'axios'

function Sections() {
    const [sections, setSections] = useState([])

    useEffect(() => {
        axios.get('http://localhost:3001/sections')
        .then(res => {
            setSections(res.data.sections)
        })
    }, [])

    return (
        <div className={classes.relativeWrapper}>
            <div className={classes.sectionsWrapper}>
                <ul>
                    {sections.map((sectionName, index) => 
                        <li key={index}><Section name={sectionName} /></li>
                    )}
                </ul>
            </div>
        </div>
    );
}

export default Sections;
