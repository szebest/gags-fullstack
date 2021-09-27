import classes from './styles/Notification.module.scss'
import axios from 'axios'
import Cookies from 'js-cookie'

function Notification({ data, setRead, index }) {
    const sendRequest = () => {
        axios({
            method: "PATCH",
            url: `http://localhost:3001/user/notification/${data._id}?read=true`,
            headers: { 
                "Authorization": `Bearer ${Cookies.get("accessToken")}`
            }
        })
        .then(res => {
            setRead(index)
        })
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