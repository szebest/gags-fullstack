import classes from './styles/Notifications.module.scss'
import { Scrollbars } from 'react-custom-scrollbars';
import Notification from '../Notification/Notification';
import { useState, useEffect } from 'react'

function Notifications({ data, showModal }) {
    const [dataState, setDataState] = useState(data)

    useEffect(() => {
        setDataState(data)
    }, [data])

    if (!data)
        return <></>

    const unreadNotificationsAmount = data.reduce((previousValue, currentValue) => {
        if (currentValue.read) return previousValue
        else return previousValue + 1
    }, 0)

    const setRead = (index) => {
        dataState[index].read = true
        setDataState(prev => [...prev])
    }

    return (
        <div className={classes.notificationsWrapper}>
            {unreadNotificationsAmount > 0 &&
                <div className={classes.unreadAmount}>
                    <p>{unreadNotificationsAmount}</p>
                </div>
            }
            {showModal &&
            <div className={classes.notificationsContent}>
                <Scrollbars 
                autoHide
                autoHideTimeout={500}
                autoHideDuration={200}>
                    {dataState.map((notification, index) => 
                        <Notification key={notification._id} data={notification} setRead={setRead} index={index} />
                    )}
                </Scrollbars>
            </div>
            }
        </div>
    )
}

export default Notifications
