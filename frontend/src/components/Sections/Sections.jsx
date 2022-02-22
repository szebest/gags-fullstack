import classes from './styles/Sections.module.scss'
import Section from '../Section/Section'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Scrollbars } from 'react-custom-scrollbars';

function Sections() {
    const [sections, setSections] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [hideButton, setHideButton] = useState(false)
    const scrollValueRef = useRef(0)

    const handleScroll = () => {
        const previousScrollY = scrollValueRef.current
        const difference = window.scrollY - previousScrollY
        if (difference > 400) {
            setHideButton(true)
            scrollValueRef.current = window.scrollY
        }
        else if (difference < -400) {
            setHideButton(false)
            scrollValueRef.current = window.scrollY
        }
    }

    useEffect(() => {
        scrollValueRef.current = window.scrollY
        let cancel
        axios.get('https://gags-backend.herokuapp.com/sections', {
            cancelToken: new axios.CancelToken(c => cancel = c)
        })
        .then(res => {
            setSections(res.data.sections)
        })

        window.addEventListener('scroll', handleScroll)

        return () => {
            cancel()
            window.removeEventListener('scroll', handleScroll)
        }
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
            <div className={`${classes.toggleButtonWrapper} ${hideButton ? classes.hideButton : ""}`} onClick={() => hideButton ? {} : setShowModal(prev => !prev)}>
                <div className={classes.toggleButton}>
                    <div></div>
                </div>
            </div>
        </div>
    );
}

export default Sections;
