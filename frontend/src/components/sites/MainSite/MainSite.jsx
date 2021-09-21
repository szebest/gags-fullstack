import classes from './styles/MainSite.module.scss'
import Sections from '../../Sections/Sections'
import PostsContainer from '../../PostsContainer/PostsContainer'

function MainSite() {
    return (
        <div className={classes.siteCenter}>
            <div className={classes.mainSiteWrapper}>
                <Sections />
                <PostsContainer />
            </div>
        </div>
    );
}

export default MainSite;
