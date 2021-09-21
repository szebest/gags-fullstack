import classes from './styles/Section.module.scss'
import { Link } from 'react-router-dom'

function Section({ name }) {
    return (
        <div className={classes.sectionWrapper}>
            <Link to={`/section/${name}`}>
                <h4>{name}</h4>
            </Link>
        </div>
    );
}

export default Section;
