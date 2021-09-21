import classes from './styles/SectionSite.module.scss'
import { useParams } from 'react-router-dom'
import Sections from '../../Sections/Sections'
import PostsContainer from '../../PostsContainer/PostsContainerAPI'

function SectionSite() {
    const { sectionName } = useParams()
    return (
        <div className={classes.mainSiteWrapper}>
            <Sections />
            <PostsContainer sectionName={sectionName} />
        </div>
    );
}

export default SectionSite;
