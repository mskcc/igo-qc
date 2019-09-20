// TODO - When fully integrated
// import React from 'react';
// import './index.css';

import ProjectRouter from './project_router.js';
import Project from './Project.js';
import { unixTimeStringToDateString } from './utils/format.js';
import GET_SEQ_ANALYSIS_SAMPLE_RESP from './getRecentDeliveries_seqAnalysis.js';
import GET_RECENT_DELIVERIES_RESP from './getRecentDeliveries_request.js';

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

    /**
    * Sends service call to retrieve most recent deliveries
    */
    getSeqAnalysisProjects() {
        // TODO - Don't mock
        // TODO - Currently the same endpoint gives very different responses. See GetDelivered.java from GetRecentDeliveries.java
        // REQUEST: "/LimsRest/getRecentDeliveries"
        // Table: "SeqAnalysisSampleQC", Query: "DateCreated >  1484508629000 AND SeqQCStatus != 'Passed' AND SeqQCStatus not like 'Failed%'"
        return GET_SEQ_ANALYSIS_SAMPLE_RESP;
    }

    /**
     * Sends service call to retrieve most recent deliveries
     */
    getRequestProjects() {
        // TODO - Don't mock
        // TODO - Currently the same endpoint gives very different responses. See GetDelivered.java from GetRecentDeliveries.java
        // REQUEST: "/LimsRest/getRecentDeliveries?time=2&units=d"
        // Table: "Request", Query: "RecentDeliveryDate > " + searchPoint + " AND (Investigatoremail = '" + investigator + "' OR LabHeadEmail = '" + investigator + "')"
        return GET_RECENT_DELIVERIES_RESP;
    }

    /**
     * Sets component state to track Sequence Analysis entries from LIMS (Table: "SeqAnalysisSampleQC")
     */
    setSeqAnalysisState() {
        const resp = this.getSeqAnalysisProjects();
        const projects = this.processSeqAnalysisResponse(resp);

        const projectsToReview = projects[0].map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));
        const projectsToSequenceFurther = projects[1].map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));

        this.setState({ projectsToReview, projectsToSequenceFurther });
    }

    /**
     * Sets component state to track Request entries from LIMS (Table: "Request")
     */
    setRequestState(){
        const resp = this.getRequestProjects();
        const projects = this.processRequestResponse(resp)

        const recentDeliveries = projects.map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));
        this.setState({ recentDeliveries });
    }

    /**
     * Seperates Sequence Analysis response into project categories, "Needs Review" & "Requires Further Sequencing"
     *
     * @param projects, Object[] - Response from LIMS containing entries from the Sequence Analysis Table
     * @returns {[Object[], Object[]]}, Array of two Project lists
     */
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

    /**
     * Enriches/sorts response of project requests
     *
     * @param projects, Object[] - Response from the LIMS of entries in the Request table
     * @returns {*}
     */
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

    /**
    * Returns if a project is ready, which is true if none of its samples have 'basicQcs' entries
    *
    * @param project, Object - Project entry taken directly from response
    */
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

    /**
     * Based on the basicQcs::qcStatus of each sample. Only one sample in the project needs to be under-review to be un-reviewed
     *
     * @param project, Object - Project entry taken directly from response
     * @returns {boolean}
     */
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

    /**
     * Returns recent runs and most date of the most recent sample
     *
     * @param project, Object - Project entry taken directly from response
     * @returns {[*, number]}
     */
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

    /**
     * Returns the runs associated with the project
     *
     * @param project
     * @returns {Object[]}
     */
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

    /**
     * Returns the date of the most recent basic qc analysis
     *
     * @param project
     * @returns {number}
     */
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

    render() {
        return <div className="col-sm-14 col-md-14 col-lg-14">
            <div className="widget-box">
                <div className="widget-container table-responsive">
                    <div className="content noPad clearfix">
                        <h3>Sequence Analysis</h3>
                        <div className="project-router-container">
                            <ProjectRouter name="Needs Review" projects={this.state.projectsToSequenceFurther}/>
                        </div>
                        <div className="project-router-container">
                            <ProjectRouter name="Requires Further Sequencing" projects={this.state.projectsToReview}/>
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