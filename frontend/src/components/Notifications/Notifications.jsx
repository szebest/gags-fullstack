import classes from './styles/Notifications.module.scss'
import { Scrollbars } from 'react-custom-scrollbars';
import Notification from '../Notification/Notification';

function Notifications({ data, showModal }) {
    if (!data)
        return <></>

    const unreadNotificationsAmount = data.reduce((previousValue, currentValue) => {
        if (currentValue.read) return previousValue
        else return previousValue + 1
    }, 0)

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
                    {data.map((notification) => 
                        <Notification key={notification._id} data={notification} />
                    )}
                </Scrollbars>
            </div>
            }
        </div>
    )
}

export default Notifications
