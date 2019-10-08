// TODO - When fully integrated
import React, { useState } from 'react';

import './index.css';

import ProjectRouter from './project_router.js';
import Project from './Project.js';
import { unixTimeStringToDateString } from './utils/format.js';
import { getSeqAnalysisProjects, getRequestProjects } from './services/igo-qc-service.js';

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

    /*
    // Sets component state to track Sequence Analysis entries from LIMS (Table: "SeqAnalysisSampleQC")
    setSeqAnalysisState() {
        const resp = getSeqAnalysisProjects();
        const projects = this.processSeqAnalysisResponse(resp);

        const projectsToReview = projects[0].map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));
        const projectsToSequenceFurther = projects[1].map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));

        this.setState({ projectsToReview, projectsToSequenceFurther });
    }

    // Sets component state to track Request entries from LIMS (Table: "Request")
    setRequestState(){
        const resp = getRequestProjects();
        const projects = this.processRequestResponse(resp)

        const recentDeliveries = projects.map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));
        this.setState({ recentDeliveries });
    }

    // Seperates Sequence Analysis response into project categories, "Needs Review" & "Requires Further Sequencing"
    processSeqAnalysisResponse(projects){
        const projectsToReview = [];
        const projectsToSequenceFurther = [];
        let runs, recentDate, projectReady;
        for(const project of projects){
            projectReady = this.isProjectReady(project);
            project['ready'] = projectReady;

            if(this.isUnreviewed(project)){
                projectsToReview.push(project);
            } else {
                projectsToSequenceFurther.push(project);
            }

            runs = this.getRuns(project);
            recentDate = this.getRecentDate(project);
            project['run'] = runs.join(', ');
            project['ordering'] = recentDate;

            project['date'] = unixTimeStringToDateString(recentDate);
        }

        projectsToReview.sort( (p1, p2) => { return p1['ordering']-p2['ordering']; });
        projectsToSequenceFurther.sort( (p1, p2) => { return p1['ordering']-p2['ordering']; });

        return [projectsToReview, projectsToSequenceFurther];
    }

    // Enriches/sorts response of project requests
    processRequestResponse(projects){
        let recentDate;
        for(const project of projects){
            recentDate = this.getRecentDate(project);
            project['ordering'] = recentDate;
            project['date'] = unixTimeStringToDateString(recentDate);
        }
        projects.sort( (p1, p2) => { return p1['ordering']-p2['ordering']; });
        return projects;
    }

    // Returns if a project is ready, which is true if none of its samples have 'basicQcs' entries
    isProjectReady(project){
        const samples = project['samples'] || [];
        if(samples.length === 0) return false;

        // Check all samples to see if any have a non-empty basicQcs field, which indicates the project is not ready
        for(const sample of samples){
            if(sample['basicQcs'] && sample['basicQcs'].length === 0){
                return false;
            }
        }

        return true;
    }

    // Based on the basicQcs::qcStatus of each sample. Only one sample in the project needs to be under-review to be un-reviewed
    isUnreviewed(project) {
        const samples = project['samples'] || [];

        let basicQcs, isUnreviewed;
        for(const sample of samples){
            basicQcs = sample['basicQcs'] || [];
            isUnreviewed = basicQcs.reduce((isUnderReview, basicQc) => {
                return isUnderReview || (basicQc['qcStatus'] && basicQc['qcStatus'] === 'Under-Review');
            }, false);
            if(isUnreviewed) return true;
        }

        return false;
    }

    // Returns recent runs and most date of the most recent sample
    getRecentDate(project) {
        const samples = project['samples'] || [];
        const runs = new Set([]);
        let recentDate = 0;
        let basicQcs;
        for(const sample of samples){
            basicQcs = sample['basicQcs'] || [];
            let run;
            for(const qc of basicQcs){
                run = qc['run'] || '';
                const matches = run.match('([A-Z|0-9]+_[0-9]+)');
                const trimmed = matches[0];
                runs.add(trimmed);
                if(qc['createDate'] > recentDate){
                    recentDate = qc['createDate'];
                }
            }
        }
        return [ Array.from(runs), recentDate ];
    }

    // Returns the runs associated with the project
    getRuns(project) {
        const samples = project['samples'] || [];
        const runs = new Set([]);
        let basicQcs;
        for(const sample of samples){
            basicQcs = sample['basicQcs'] || [];
            let run;
            for(const qc of basicQcs){
                run = qc['run'] || '';
                const matches = run.match('([A-Z|0-9]+_[0-9]+)');
                const trimmed = matches[0];
                runs.add(trimmed);
            }
        }
        return Array.from(runs);
    }

    // Returns the date of the most recent basic qc analysis
    getRecentDate(project) {
        const samples = project['samples'] || [];
        let recentDate = 0;
        let basicQcs;
        for(const sample of samples){
            basicQcs = sample['basicQcs'] || [];
            for(const qc of basicQcs){
                if(qc['createDate'] > recentDate){
                    recentDate = qc['createDate'];
                }
            }
        }
        return recentDate;
    }
    */
}

export default App;