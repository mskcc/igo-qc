import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import { faHome } from '@fortawesome/free-solid-svg-icons';

import Home from './components/routers/main-router.js';
import CellRanger from './components/project-page/project-page.js';
import { getRequestProjects, getSeqAnalysisProjects, getRecentRuns } from "./services/igo-qc-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from './components/common/modal';
import { MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE } from "./constants";
import MuiButton from "@material-ui/core/Button/Button";
import config from './config.js';
import Logo from './resources/igo-logo.jpeg';
import Feedback from './components/common/feedback';

function App() {
    /*
        Project lists are initialised as null so "Loading" indicators can distinguish between pending service calls
        and responses that do not return data. IF RENDERED, A DEFAULT VALUE MUST BE PROVIDED (e.g. "recentRuns || []")
    */
    const [projectsToReview, setProjectsToReview] = useState(null);
    const [projectsToSequenceFurther, setProjectsToSequenceFurther] = useState(null);
    const [recentDeliveries, setRecentDeliveries] = useState(null);
    const [recentRuns, setRecentRuns] = useState(null);

    const [projectSearch, setProjectSearch] = useState('');
    const [modalUpdate, setModalUpdate] = useState({});
    const [showFeedback, setShowFeedback] = useState(false);

    // TODO - Implement response caching
    const [projectMap, setProjectMap] = useState({});           // ProjectMap keeps track of data needed by components

    // TODO - constants for modal type
    const addModalUpdate = (type, msg, delay) => {
        const modalUpdate = {
            msg: msg,
            type: type,
            delay: delay || 5000
        };
        setModalUpdate(modalUpdate);
    };

    // NOTE - Ordering matters. RecentRuns request doesn't query the LIMS so this will return faster
    useEffect(() => {
        getRecentRuns()
            .then((resp) => {
                const recentRuns = resp.recentRuns || [];
                setRecentRuns(recentRuns);
            })
            .catch(error => {
                setRecentRuns([]);
                addModalUpdate(MODAL_ERROR, error.message || 'ERROR')
            });
    }, []);
    useEffect(() => {
        // TODO - modal to display error
        getSeqAnalysisProjects()
            .then((resp) => {
                const projectsToReview = resp.projectsToReview || [];
                const projectsToSequenceFurther = resp.projectsToSequenceFurther || [];
                setProjectsToReview(projectsToReview);
                setProjectsToSequenceFurther(projectsToSequenceFurther);

                addToProjectMap(projectsToReview);
                addToProjectMap(projectsToSequenceFurther);
            })
            .catch(error => {
                // Allow rendering of an empty list
                setProjectsToReview([]);
                setProjectsToSequenceFurther([]);
                addModalUpdate(MODAL_ERROR, error.message || 'ERROR')
            });
    }, []);
    useEffect(() => {
        // TODO - modal to display error
        getRequestProjects()
            .then((resp) => {
                const recentDeliveries = resp.recentDeliveries || [];
                setRecentDeliveries(recentDeliveries);
            })
            .catch(error => {
                // Allow rendering of an empty list
                setRecentDeliveries([]);
                addModalUpdate(MODAL_ERROR, error.message || 'ERROR')
            });
    }, []);

    const addToProjectMap = (projectList) => {
        if(projectList.length === 0) return;

        for(let project of projectList){
            const id = project['requestId'];
            const recipe = project['requestType'];

            // THIS SHOULD NEVER HAPPEN
            if(projectMap[id]){
                throw new Error('TRYING TO REPLACE AN EXISTING REQUEST ID');
            }

            if(id){
                projectMap[id] = { recipe }
            }
        }
        setProjectMap(projectMap);
    };

    const handleProjectSearch = (evt) => {
        setProjectSearch(evt.target.value);
    };
    const ButtonToNavigate = ({ history }) => (
        <MuiButton
            variant="contained"
            type="submit"
            onClick={() => history.push(`${config.SITE_HOME}projects/` + projectSearch)}
            className={"project-search-submit vertical-align-top project-search margin-left-10"}
            disabled={false}
            size={"small"}>
            <p className={"margin-0"}>Search</p>
        </MuiButton>
    );
    const SearchButton = () => (
        <Route path="/" render={(props) => <ButtonToNavigate {...props} title="Navigate to project" />} />
    );

    return <div>
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
                <div className={"body-container margin-top-15 padding-hor-5per"}>
                    <Switch>
                        <Route exact path={config.SITE_HOME}>
                            <Home recentDeliveries={recentDeliveries}
                                  projectsToReview={projectsToReview}
                                  projectsToSequenceFurther={projectsToSequenceFurther}
                                  recentRuns={recentRuns}/>
                        </Route>
                        <Route
                            path={`${config.SITE_HOME}projects/:pid`}
                            render={(props) => <CellRanger {...props} projectMap={projectMap} addModalUpdate={addModalUpdate}/>}
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