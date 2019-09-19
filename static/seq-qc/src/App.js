// import React from 'react';
import './index.css';

import ProjectRouter from './project_router.js';
import Project from './Project.js';
import GET_RECENT_DELIVERIES_RESP from './getRecentDeliveries.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        activeProjects: [],
        reviewProjects: []
    };
  }

  componentDidMount() {
    this.init();
  }

  init() {
    this.setProjectState();
  }

    /**
     * Sets component state to track projects
     */
  setProjectState() {
    const projectResp = this.getProjects();
    const projects = this.processProjectResponse(projectResp);

    const activeProjects = projects[0].map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));
    const reviewProjects = projects[1].map((p) => new Project(p.pi, p.requestType, p.requestId, p.run, p.date));

    this.setState({ activeProjects, reviewProjects });
  }

  /**
   * Returns if a project is ready, which is true if none of its samples have 'basicQcs' entries
   *
   * @param project, Object - Project entry taken directly from response
   */
  isProjectReady(project){
    const samples = project['samples'] || [];
    if(samples.length == 0) return false;

    // Check all samples to see if any have a non-empty basicQcs field, which indicates the project is not ready
    for(const sample of samples){
        if(sample['basicQcs'] && sample['basicQcs'].length === 0){
            return false;
        }
    }

    return true;
  }

  //
    /**
     * Based on the basicQcs::qcStatus of each sample. Only one sample in the project needs to be under-review to be un-reviewed
     *
     * @param project, Object - Project entry taken directly from response
     * @returns {boolean}
     */
  isUreviewed(project) {
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
    getRunsAndRecentDate(project) {
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
   * Sends service call to retrieve most recent deliveries
   *
   */
  getProjects() {
      /*
       TODO - Don't mock
      */
    return GET_RECENT_DELIVERIES_RESP;
  }

    /**
     * Enriches project response with fields for categorizing each project
     *
     * @param projects
     * @returns {[[], []]}
     */
  processProjectResponse(projects){
    const review_projects = [];
    const active_projects = [];
    let runs, recentDate, projectReady;
    for(const project of projects){
      projectReady = this.isProjectReady(project);
      project['ready'] = projectReady;

      if(this.isUreviewed(project)){
        review_projects.push(project);
      } else {
        active_projects.push(project);
      }

      [ runs, recentDate ] = this.getRunsAndRecentDate(project);
      project['run'] = runs.join(', ');
      project['ordering'] = recentDate;

      // TODO - project['date'] = time.strftime('%Y-%m-%d %H:%M', time.localtime((recentDate/1000)))
      project['date'] = recentDate;
    }

    review_projects.sort( (p1, p2) => { return p1['ordering']-p2['ordering']; });
    active_projects.sort( (p1, p2) => { return p1['ordering']-p2['ordering']; });

    return [review_projects, active_projects];
  }

  render() {
    /* <ProjectRouter name="Recent Deliveries" projects={this.state.projects}/> */
    return <div className="router-container">
        <ProjectRouter name="Needs Review" projects={this.state.reviewProjects}/>
        <ProjectRouter name="Requires Further Sequencing" projects={this.state.activeProjects}/>
    </div>;
  }
}

export default App;