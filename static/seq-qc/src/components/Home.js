// TODO - When fully integrated
import React, { useState } from 'react';

import '../index.css';

import ProjectRouter from './project_router.js';
import { unixTimeStringToDateString } from '../utils/format.js';
import { getSeqAnalysisProjects, getRequestProjects } from '../services/igo-qc-service.js';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            projectsToReview: [],
            projectsToSequenceFurther: [],
            recentDeliveries: []
        };
    }

    componentDidMount() {
        this.init();
    }

    init() {
        this.setSeqAnalysisState();
        this.setRequestState();
    }

    setSeqAnalysisState() {
        getSeqAnalysisProjects()
            .then((resp) => this.setState({ projectsToReview: resp.projectsToReview || [],
                                            projectsToSequenceFurther: resp.projectsToSequenceFurther || [] }));
    }

    setRequestState(){
        getRequestProjects()
            .then((resp) => this.setState({ recentDeliveries: resp.recentDeliveries}))
    }

    render() {
        return <div className="col-sm-14 col-md-14 col-lg-14">
            <div className="widget-box">
                <div className="widget-container table-responsive">
                    <div className="content noPad clearfix">
                        <h3>Sequence Analysis</h3>
                        <div className="project-router-container">
                            <ProjectRouter name="Needs Review" projects={this.state.projectsToReview}/>
                        </div>
                        <div className="project-router-container">
                            <ProjectRouter name="Requires Further Sequencing" projects={this.state.projectsToSequenceFurther}/>
                        </div>
                        <h3>Requests</h3>
                        <div className="project-router-container">
                            <ProjectRouter name="Recent Deliveries" projects={this.state.recentDeliveries}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }
}

export default App;