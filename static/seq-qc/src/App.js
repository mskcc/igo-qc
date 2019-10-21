import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import { faHome } from '@fortawesome/free-solid-svg-icons';

import Home from './components/routers/main-router.js';
import CellRanger from './components/project-page/app.js';
import { getRequestProjects, getSeqAnalysisProjects, getRecentRuns } from "./services/igo-qc-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from './components/common/modal';
import { MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE } from "./constants";

function App() {
    const [projectsToReview, setProjectsToReview] = useState([]);
    const [projectsToSequenceFurther, setProjectsToSequenceFurther] = useState([]);
    const [recentDeliveries, setRecentDeliveries] = useState([]);
    const [recentRuns, setRecentRuns] = useState([]);
    const [projectSearch, setProjectSearch] = useState('');
    const [modalUpdate, setModalUpdate] = useState({});

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
            .catch(error => {addModalUpdate(MODAL_ERROR, error.message || 'ERROR') });
    }, []);
    useEffect(() => {
        // TODO - modal to display error
        getRequestProjects()
            .then((resp) => {
                const recentDeliveries = resp.recentDeliveries || [];
                setRecentDeliveries(recentDeliveries);
            })
            .catch(error => {addModalUpdate(MODAL_ERROR, error.message || 'ERROR') });
    }, []);
    useEffect(() => {
       getRecentRuns()
           .then((resp) => {
               const recentRuns = resp.recentRuns || [];
               setRecentRuns(recentRuns);
           })
           .catch(error => {addModalUpdate(MODAL_ERROR, error.message || 'ERROR')});
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
        <button
            type="button"
            onClick={() => history.push('/projects/' + projectSearch)}
            className={"margin-left-20"}>
                Search
        </button>
    );
    const SearchButton = () => (
        <Route path="/" render={(props) => <ButtonToNavigate {...props} title="Navigate to project" />} />
    );

    return <div className={"margin-hor-5per"}>
            <Modal update={modalUpdate}/>
            <Router>
                <div>
                    <div className={"inline-block"}>
                        <Link to="/">
                            <FontAwesomeIcon className={"black-color em5"} icon={faHome}/>
                        </Link>
                    </div>
                    <div className={"inline-block margin-left-20"}>
                        <label>
                            Project Search:
                            <input type="text" value={projectSearch} onChange={handleProjectSearch} />
                        </label>
                    </div>
                    <SearchButton/>
                </div>
                <Switch>
                    <Route exact path="/">
                        <Home recentDeliveries={recentDeliveries}
                              projectsToReview={projectsToReview}
                              projectsToSequenceFurther={projectsToSequenceFurther}
                              recentRuns={recentRuns}/>
                    </Route>
                    <Route
                      path='/projects/:pid'
                      render={(props) => <CellRanger {...props} projectMap={projectMap} addModalUpdate={addModalUpdate}/>}
                    />
                </Switch>
            </Router>
        </div>
}

export default App;