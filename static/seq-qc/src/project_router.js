// TODO - When fully integrated
// import React from 'react';
// import ReactDOM from 'react-dom';
// import PropTypes from 'prop-types';


import { CELL_RANGER_APPLICATION } from './constants.js';

const FIELD_MAP = {
    "pi": "PI",
    "requestType": "Type",
    "requestId": "Request Id",
    "run": "Recent Runs",
    "date": "Date of Latest Stats"
};

/**
 * Router for Projects
 */
class ProjectRouter extends React.Component {
  constructor(props){
    super(props);
    this.state = {
        fields: [],
        headers: []
    };
  }

  componentDidUpdate(prevProps){
    if(prevProps.projects !== this.props.projects){
        this.setFieldsFromProjects(this.props.projects);
    }
  }

  setFieldsFromProjects(projects){
    if(projects && projects.length > 0){
        const firstProject = projects[0];
        const fields = Object.keys(FIELD_MAP).filter((field) => {
            return firstProject[field]
        });
        const headers = fields.map((field) => FIELD_MAP[field])
        this.setState({ fields, headers });
    }
  }

  renderHeaders(){
    return <thead><tr className="fill-width">{ this.state.headers.map( (field) =>
        <th className="project-field" key={field}>
            <p className="font-size-16 font-bold">{field}</p>
        </th>) }</tr></thead>;
  }

  getRedirectFunction(requestType, requestId) {
    // Non cell-ranger types should redirect to a /projectId flask mapping that will render a data_table.html
    // Cell-Ranger types will render their own

    // EVENTUALLY, this will be for all projects. For now, only a few projects will be moved over to the QC site
    const newPages = new Set([ CELL_RANGER_APPLICATION ]);


    // '/project' indicates new page
    const applicationUrl = !newPages.has(requestType) ? 'project/' : '/';
    const redirect = () => window.location=`${applicationUrl}${requestId}`;

    return redirect;
  }

  renderProjects() {
    const projectElements = [];
    for( const project of this.props.projects ){
        const fields = this.state.fields.map( (field) => project[field] );
        const redirect = this.getRedirectFunction(project.requestType, project.requestId);
        const element = <tr className="fill-width project-row" onClick={redirect} key={project.requestId}>
            {
                fields.map( field => <td className="project-field field-header" key={field}>
                        <p className="font-size-12">{field}</p>
                    </td>)
            }
        </tr>;
        projectElements.push(element);
    }
    return <tbody>{projectElements}</tbody>;
  }

  renderTable(){
    // Visualize projects if present and state has been populated w/ fields to visualize
    if(this.props.projects && this.state.fields.length > 0){
        return <table className="project-table fill-width">
            {this.renderHeaders()}
            {this.renderProjects()}
        </table>
    } else {
        return <div></div>
    }
  }

  render() {
    return (
        <div>
            <div>
                <p className="font-size-24">{this.props.name}</p>
            </div>
            {this.renderTable()}
        </div>
    );
  }
}

export default ProjectRouter;

ProjectRouter.propTypes = {
    name: PropTypes.string,
    projects: PropTypes.array
};
