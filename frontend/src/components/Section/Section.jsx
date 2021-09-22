import classes from './styles/Section.module.scss'
import { Link } from 'react-router-dom'

function Section({ name }) {
    return (
        <div className={classes.sectionWrapper}>
            <Link to={`/section/${name}`}>
                <p>{name}</p>
            </Link>
        </div>
    );
}

export default Section;
