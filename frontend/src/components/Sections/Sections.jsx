import classes from './styles/Sections.module.scss'
import Section from '../Section/Section'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Scrollbars } from 'react-custom-scrollbars';

function Sections() {
    const [sections, setSections] = useState([])
    const [showModal, setShowModal] = useState(false)

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
        <div className={classes.relativeWrapper} tabIndex="0" onBlur={() => setShowModal(false)}>
            <div className={`${classes.sectionsWrapper} ${classes.fixedSectionsWrapper} ${showModal ? classes.visible : ""}`}>
                <Scrollbars 
                    autoHide
                    autoHideTimeout={500}
                    autoHideDuration={200}>
                    <ul>
                        {sections.map((sectionName, index) => 
                            <li onClick={() => setShowModal(false)} key={index}><Section name={sectionName} /></li>
                        )}
                    </ul>
                </Scrollbars>
            </div>
            <div className={classes.toggleButtonWrapper} onClick={() => setShowModal(prev => !prev)}>
                <div className={classes.toggleButton}>
                    <div></div>
                </div>
            </div>
        </div>
    );
}

export default Sections;
