// TODO - When fully integrated
import React from 'react';

import '../index.css';
import ProjectRouter from './project_router.js';
import RunRouter from './run_router';
import PropTypes from 'prop-types';

const App = (props) => {
    return <div className="col-sm-14 col-md-14 col-lg-14">
            <div className="widget-box">
                <div className="widget-container table-responsive">
                    <div className="content noPad clearfix">
                        <h3>Sequence Analysis</h3>
                        <div className="project-router-container">
                            <ProjectRouter name="Needs Review" projects={props.projectsToReview}/>
                        </div>
                        <div className="project-router-container">
                            <ProjectRouter name="Requires Further Sequencing" projects={props.projectsToSequenceFurther}/>
                        </div>
                        <h3>Requests</h3>
                        <div className="project-router-container">
                            <ProjectRouter name="Recent Deliveries" projects={props.recentDeliveries}/>
                        </div>
                        <h3>Recent Runs</h3>
                        <div className="project-router-container">
                            <RunRouter projects={props.recentRuns}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
};

export default App;

ProjectRouter.propTypes = {
    projectsToReview: PropTypes.array,
    projectsToSequenceFurther: PropTypes.array,
    recentDeliveries: PropTypes.array,
    recentRuns: PropTypes.array
};