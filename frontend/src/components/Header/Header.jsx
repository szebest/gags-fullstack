import classes from './styles/Header.module.scss'
import Login from '../Login/Login'
import { Link } from "react-router-dom"

function Header() {
    return (
        <header className={classes.headerWrapper}>
            <div>
                <div>
                    <ul>
                        <li>
                            <Link to="/"><h1>GAGS</h1></Link>
                        </li>
                        <li>
                            <Link to="/about">ABOUT</Link>
                        </li>
                    </ul>
                    <Login />
                </div>
            </div>
        </header>
    );
}

export default Header;
