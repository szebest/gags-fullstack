import classes from './styles/Header.module.scss'
import Navbar from '../Navbar/Navbar'
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
