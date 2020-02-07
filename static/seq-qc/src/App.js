import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { useSelector, useDispatch } from 'react-redux';

import Home from './components/routers/main-router.js';
import ProjectPage from './components/project-page/project-page.js';
import { getRequestProjects, getSeqAnalysisProjects } from "./services/igo-qc-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from './components/common/modal';
import {
    CROSSCHECK_METRICS_FLAG,
    LIMS_REQUEST_ID,
    MODAL_ERROR, PROJECT_FLAGS
} from "./resources/constants";
import MuiButton from "@material-ui/core/Button/Button";
import config from './config.js';
import Logo from './resources/igo-logo.jpeg';
import Feedback from './components/common/feedback';
import {getCrosscheckMetrics} from "./services/ngs-stats-service";
import {SET_PROJECTS} from "./redux/actionTypes";

function App() {
    /*
        Project lists are initialised as null so "Loading" indicators can distinguish between pending service calls
        and responses that do not return data. IF RENDERED, A DEFAULT VALUE MUST BE PROVIDED
    */
    const [projectsToReview, setProjectsToReview] = useState(null);
    const [projectsToSequenceFurther, setProjectsToSequenceFurther] = useState(null);
    const [recentDeliveries, setRecentDeliveries] = useState(null);
    const [projectSearch, setProjectSearch] = useState('');
    const [modalUpdate, setModalUpdate] = useState({});
    const [showFeedback, setShowFeedback] = useState(false);

    const stateProjects = useSelector(state => state.projects );
    const dispatch = useDispatch();

    useEffect(() => {
        getSeqAnalysisProjects()
            .then((resp) => {
                const projectsToReview = resp.projectsToReview || [];
                const projectsToSequenceFurther = resp.projectsToSequenceFurther || [];
                setProjectsToReview(projectsToReview);
                setProjectsToSequenceFurther(projectsToSequenceFurther);

                // Call crosscheck metrics on all projects in @resp
                const projectsToReviewList = projectsToReview.map((proj) => {return proj['requestId']});
                const projectsToSequenceFurtherList = projectsToSequenceFurther.map((proj) => {return proj['requestId']});
                const projectList = projectsToSequenceFurtherList.concat(projectsToReviewList);

                getCrosscheckMetrics(projectList)
                    .then((cmProjectsUpdate) => {
                        // Update store w/ projects
                        updateProjects(cmProjectsUpdate);
                        // Enrich projects in component state w/ flags returned from crosscheckMetrics update
                        updateProjectFlags(projectsToReview, setProjectsToReview, cmProjectsUpdate, "Fingerprinting");
                        updateProjectFlags(projectsToSequenceFurther, setProjectsToSequenceFurther, cmProjectsUpdate, "Fingerprinting");
                    });
            })
            .catch(error => {
                // Allow rendering of an empty list
                setProjectsToReview([]);
                setProjectsToSequenceFurther([]);
                addModalUpdate(MODAL_ERROR, error.message || 'ERROR')
            });
        getRequestProjects()
            .then((resp) => {
                const recentDeliveries = resp.recentDeliveries || [];
                setRecentDeliveries(recentDeliveries);

                const projectList = recentDeliveries.map((proj) => { return proj['requestId']});
                getCrosscheckMetrics(projectList)
                    .then((cmProjectsUpdate) => {
                        // Update store w/ projects
                        updateProjects(cmProjectsUpdate);
                        // Enrich projects in component state w/ flags returned from crosscheckMetrics update
                        updateProjectFlags(recentDeliveries, setRecentDeliveries, cmProjectsUpdate, "Fingerprinting");
                    });
            })
            .catch(error => {
                // Allow rendering of an empty list
                setRecentDeliveries([]);
                addModalUpdate(MODAL_ERROR, error.message || 'ERROR')
            });
    }, []);

    /**
     * Updates flags of projects. Enriches flag field on each project object
     *
     * @param projects, Projects in state to update (projectsToReview, projectsToSequenceFurther, recentDeliveries)
     * @param updateFunction, state-update function
     * @param cmProjectsUpdate, service response with updates
     * @param type, type of flag to update
     */
    const updateProjectFlags = (projects, updateFunction, cmProjectsUpdate, type) => {
        if(projects === null || Object.keys(projects).length === 0) return;
        const updatedProjects = projects.map((project) => {
            const flags = getFlags(project, cmProjectsUpdate);
            if(flags !== null && flags !== undefined){
                project[PROJECT_FLAGS] = {
                    [type]: flags
                };
            }
            return project;
        });
        updateFunction(updatedProjects);
    };

    /**
     * Returns project flags for a project based on the crossmetric update
     *      Null:       No data available
     *      Empty List: Passes checks
     *      List:       Did not pass checks
     *
     * @param project, Object
     * @param cmProjectsUpdate, Object
     * @returns {string|null|any}
     */
    const getFlags = (project, cmProjectsUpdate) => {
        const pId = project[LIMS_REQUEST_ID];
        const projectEntry = cmProjectsUpdate[pId] || {};
        return projectEntry[CROSSCHECK_METRICS_FLAG];
    };

    /**
     * Updates the state of projects in the application
     *
     * @param resp, { [PROJECT_KEY]: {...}, ... }
     */
    const updateProjects = (cmProjectsUpdate) => {
        const updatedProjects = Object.assign(stateProjects, cmProjectsUpdate);
        dispatch({
            type: SET_PROJECTS,
            payload: updatedProjects
        });
    };

    const addModalUpdate = (type, msg, delay) => {
        const modalUpdate = {
            msg: msg,
            type: type,
            delay: delay || 5000
        };
        setModalUpdate(modalUpdate);
    };
    const handleProjectSearch = (evt) => {
        const query = evt.target.value || '';
        setProjectSearch(query.toUpperCase().trim());
    };

    /**
     * Returns a Route component that can push paths to the site history
     */
    const SearchButton = () => {
        return <Route path="/"
                      render={ (props) => {
                          return <MuiButton
                              variant="contained"
                              type="submit"
                              onClick={() => props.history.push(`${config.SITE_HOME}projects/` + projectSearch)}
                              className={"project-search-submit vertical-align-top project-search margin-left-10"}
                              disabled={false}
                              size={"small"}>
                              <p className={"margin-0"}>Search</p>
                          </MuiButton>
                      }} />
    };

    return <div className={"light-blue-background"}>
            <Modal update={modalUpdate}/>
            <Router>
                <header className={"padding-24"}>
                    <div className={"inline-block"}>
                        <Link to={config.SITE_HOME}>
                            <FontAwesomeIcon className={"white-color em5"} icon={faHome}/>
                        </Link>
                    </div>
                    <div className={"inline-block margin-left-10"}>
                        <label>
                            <h6 className={"inline white-color"}>Project:</h6>
                        </label>
                        <input className={"inline vertical-align-top project-search margin-left-10"}
                               type="text"
                               value={projectSearch} onChange={handleProjectSearch} />
                    </div>
                    <SearchButton/>
                    <MuiButton
                        variant="contained"
                        onClick={() => setShowFeedback(!showFeedback)}
                        className={"project-search-submit hover inline-block float-right"}
                        disabled={false}
                        size={"small"}>
                        <p className={"margin-0 inline black-color"}>Feedback</p>
                    </MuiButton>
                </header>
                { showFeedback ? <Feedback addModalUpdate={addModalUpdate}
                                            closeFeedback={() => setShowFeedback(false)}/> : <div></div> }
                <div className={"body-container margin-top-15 margin-bottom-15 padding-hor-5per"}>
                    <Switch>
                        <Route exact path={config.SITE_HOME}>
                            <Home recentDeliveries={recentDeliveries}
                                  projectsToReview={projectsToReview}
                                  projectsToSequenceFurther={projectsToSequenceFurther}
                                  addModalUpdate={addModalUpdate}/>
                        </Route>
                        <Route
                            path={`${config.SITE_HOME}projects/:pid`}
                            render={(props) => <ProjectPage {...props} addModalUpdate={addModalUpdate}/>}
                        />
                    </Switch>
                </div>
                <footer>
                    <img className={"logo"}
                         src={Logo}/>
                </footer>
            </Router>
        </div>
}

export default App;
