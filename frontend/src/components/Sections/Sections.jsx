import classes from './styles/Sections.module.scss'
import Section from '../Section/Section'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Scrollbars } from 'react-custom-scrollbars';

function Sections() {
    const [sections, setSections] = useState([])

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

    return (
        <div className={classes.relativeWrapper}>
            <div className={classes.sectionsWrapper}>
                <Scrollbars 
                    autoHide
                    autoHideTimeout={500}
                    autoHideDuration={200}>
                    <ul>
                        {sections.map((sectionName, index) => 
                            <li key={index}><Section name={sectionName} /></li>
                        )}
                    </ul>
                </Scrollbars>
            </div>
        </div>
    );
}

export default Sections;
