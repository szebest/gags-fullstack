import classes from './styles/Notification.module.scss'
import axios from 'axios'

function Notification({ data }) {
    const sendRequest = () => {
        axios.patch(`http://localhost:3001/user/notification/${data._id}?read=true`)
        .then(res => {})
        .catch(err => {})
    }

    return (
        <div className={classes.notificationContainer} onClick={sendRequest}>
            <div className={`${classes.notification} ${data.read ? '' : classes.unread}`}>
                <p>{data.message}</p>
            </div>
        </div>
    )
}

export default Notification