import classes from './styles/MainSite.module.scss'
import Sections from '../../Sections/Sections'
import PostsContainer from '../../PostsContainer/PostsContainerAPI'
import { useParams } from 'react-router-dom'

function MainSite() {
    const { sectionName } = useParams()

    return (
        <div className={classes.siteCenter}>
            <div className={classes.mainSiteWrapper}>
                <Sections />
                <PostsContainer sectionName={sectionName} />
            </div>
        </div>
    );
}

export default MainSite;
