import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import { faHome } from '@fortawesome/free-solid-svg-icons';

import Home from './components/routers/main-router.js';
import CellRanger from './components/project-page/project-page.js';
import { getRequestProjects, getSeqAnalysisProjects } from "./services/igo-qc-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from './components/common/modal';
import { MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE } from "./resources/constants";
import MuiButton from "@material-ui/core/Button/Button";
import config from './config.js';
import Logo from './resources/igo-logo.jpeg';
import Feedback from './components/common/feedback';

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

    useEffect(() => {
        getSeqAnalysisProjects()
            .then((resp) => {
                const projectsToReview = resp.projectsToReview || [];
                const projectsToSequenceFurther = resp.projectsToSequenceFurther || [];

                setProjectsToReview(projectsToReview);
                setProjectsToSequenceFurther(projectsToSequenceFurther);
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
            })
            .catch(error => {
                // Allow rendering of an empty list
                setRecentDeliveries([]);
                addModalUpdate(MODAL_ERROR, error.message || 'ERROR')
            });
    }, []);

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
        setProjectSearch(query.toUpperCase());
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
                            <h6 className={"inline white-color"}>HELLO WQORLD
                            </h6>
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
                            render={(props) => <CellRanger {...props} addModalUpdate={addModalUpdate}/>}
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
