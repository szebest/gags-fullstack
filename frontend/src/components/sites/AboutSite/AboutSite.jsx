import classes from './styles/AboutSite.module.scss'
import React from 'react'
import linkedin from '../../../assets/linkedin.svg'
import github from '../../../assets/github.svg'
import axios from '../../../assets/axios.svg'
import bcrypt from '../../../assets/bcrypt.svg'
import css3 from '../../../assets/css3.svg'
import express from '../../../assets/express.svg'
import google from '../../../assets/google.svg'
import html5 from '../../../assets/html5.svg'
import javascript from '../../../assets/javascript.svg'
import jwt from '../../../assets/jwt.svg'
import mongodb from '../../../assets/mongodb.svg'
import multer from '../../../assets/multer.svg'
import nodejs from '../../../assets/nodejs.svg'
import react from '../../../assets/react.svg'
import redux from '../../../assets/redux.svg'
import scss from '../../../assets/scss.svg'

export default function AboutSite() {
    return (
        <div className={classes.aboutSiteWrapper}>
            <div className={classes.limitSpace}>
                <div className={classes.aboutSiteAuthor}>
                    <h2>Author: Mateusz Szebestik</h2>
                </div>
                <div className={`${classes.beforeLine} ${classes.center}`}>
                    <div className={classes.limitWidth}>
                        <p>This site is currently my biggest hobby project. It was made to test my skills in a big project. The site was inspired by sites such as reddit, twitter and 9gag.</p>
                    </div>
                </div>
                <div className={`${classes.aboutSiteTechStack} ${classes.beforeLine}`}>
                    <div>
                        <h3>Frontend</h3>
                        <ul className={classes.styledUl}>
                            <li>
                                <div>
                                    <img src={react} alt="react" />
                                    <p>React</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={redux} alt="redux" />
                                    <p>Redux</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={axios} alt="axios" />
                                    <p>Axios</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={javascript} alt="javascript" />
                                    <p>Javascript</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={css3} alt="css3" />
                                    <p>CSS3</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={scss} alt="scss" />
                                    <p>SCSS</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={html5} alt="html5" />
                                    <p>HTML5</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3>Backend</h3>
                        <ul className={classes.styledUl}>
                            <li>
                                <div>
                                    <img src={nodejs} alt="nodejs" />
                                    <p>NodeJS</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={express} alt="express" />
                                    <p>Express.js</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={mongodb} alt="mongodb" />
                                    <p>Mongodb</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={jwt} alt="jwt" />
                                    <p>JSONWebToken</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={bcrypt} alt="bcrypt" />
                                    <p>Bcrypt</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={multer} alt="multer" />
                                    <p>Multer</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <img src={google} alt="gcs" />
                                    <p>Google Cloud Storage</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className={`${classes.aboutSiteLink} ${classes.beforeLine}`}>
                    <ul className={classes.styledUl}>
                        <li className={classes.pointer} onClick={() => window.open("https://www.linkedin.com/in/mateusz-szebestik-951b99225/", "_blank")}>
                            <div>
                                <img src={linkedin} alt="linkedin" />
                                <p>Linkedin</p>
                            </div>
                        </li>
                        <li className={classes.pointer} onClick={() => window.open("https://github.com/szebest", "_blank")}>
                        <div>
                            <img src={github} alt="github" />
                                <p>Github</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
