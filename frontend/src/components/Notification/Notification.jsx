import classes from './styles/Notification.module.scss'
import useAuthorizedAxios from '../../hooks/useAuthorizedAxios'

function Notification({ data, setRead, index }) {
    const authorizedAxios = useAuthorizedAxios()

    const sendRequest = () => {
        authorizedAxios.patch(`/user/notification/${data._id}?read=true`)
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