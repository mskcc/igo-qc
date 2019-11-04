// TODO - When fully integrated
import React from 'react';

import '../../index.css';
import ProjectRouter from './project_router.js';
import RunRouter from './run_router';
import PropTypes from 'prop-types';

const App = (props) => {
    return <div className="col-sm-14 col-md-14 col-lg-14">
            <div className="widget-box">
                <div className="widget-container table-responsive">
                    <div className="content noPad clearfix">
                        <h3 className={"margin-0"}>Sequence Analysis</h3>
                        <div className="black-border-bottom padding-vert-15 project-router-container">
                            <ProjectRouter name="Needs Review" projects={props.projectsToReview}/>
                        </div>
                        <div className="black-border-bottom padding-vert-15 project-router-container">
                            <ProjectRouter name="Requires Further Sequencing" projects={props.projectsToSequenceFurther}/>
                        </div>
                        <h3 className={"margin-0"}>Recent Deliveries</h3>
                        <div className="black-border-bottom padding-vert-15 project-router-container">
                            <ProjectRouter name="" projects={props.recentDeliveries}/>
                        </div>
                        <h3 className={"margin-0"}>Recent Runs</h3>
                        <div className="padding-vert-15 project-router-container">
                            <RunRouter projects={props.recentRuns}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
};

export default App;

ProjectRouter.propTypes = {
    projectsToReview: PropTypes.array,              // NULL ALLOWED
    projectsToSequenceFurther: PropTypes.array,     // NULL ALLOWED
    recentDeliveries: PropTypes.array,              // NULL ALLOWED
    recentRuns: PropTypes.array                     // NULL ALLOWED
};