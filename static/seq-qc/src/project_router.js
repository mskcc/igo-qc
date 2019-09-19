// TODO - When fully integrated
// import React from 'react';
// import ReactDOM from 'react-dom';
// import PropTypes from 'prop-types';

/**
 * Router for Projects
 */
class ProjectRouter extends React.Component {
  renderHeaders(){
    const fields = [ "PI", "Type", "Request Id", "Recent Runs",	"Date of Latest Stats" ];
    return <thead><tr className="fill-width">{ fields.map( (field) =>
        <th className="project-field" key={field}>
            <p className="font-size-16 font-bold">{field}</p>
        </th>) }</tr></thead>;
  }

  renderProjects() {
    const projectElements = [];
    for( const project of this.props.projects ){
        const fields = [ project.pi, project.requestType, project.requestId, project.run, project.date ];
        const redirect = () => window.location=`${project.requestId}`;
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

  render() {
    return (
        <div>
            <div>
                <p className="font-size-24">{this.props.name}</p>
            </div>
            <table className="project-table fill-width">
                {this.renderHeaders()}
                {this.renderProjects()}
            </table>


        </div>
    );
  }
}

export default ProjectRouter;

ProjectRouter.propTypes = {
    name: PropTypes.string,
    projects: PropTypes.array
};
