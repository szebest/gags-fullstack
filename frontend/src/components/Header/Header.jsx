import classes from './styles/Header.module.scss'
import Navbar from '../Navbar/Navbar'
import { Link } from "react-router-dom"
import logo from '../../assets/logo.svg'


function Header() {
    return (
        <header className={classes.headerWrapper}>
            <div>
                <div>
                    <ul>
                        <li>
                            <Link to="/">
                                <img src={logo} alt="GAGS" />
                            </Link>
                        </li>
                        <li className={classes.about}>
                            <Link to="/about">ABOUT</Link>
                        </li>
                    </ul>
                    <Navbar />
                </div>
            </div>
        </header>
    );
}

export default Header;
