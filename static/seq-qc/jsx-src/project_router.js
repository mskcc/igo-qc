// TODO - When fully integrated
// import PropTypes from 'prop-types';

class ProjectRouter extends React.Component {
  constructor(props) {
    super(props);
  }

  renderHeaders(){
    const fields = [ "PI", "Type", "Request Id", "Recent Runs",	"Date of Latest Stats" ];
    return <div>{ fields.map( field => <div className="project-field">
                                <p className="font-size-16 font-bold">{field}</p>
                            </div>) } </div>
  }

  renderProjects() {
    const projectElements = [];
    for( const project of this.props.projects ){
        const fields = [ project.pi, project.type, project.requestId, project.recentRuns, project.date ];
        const element = <div className="fill-width">
            {
                fields.map( field => <div className="project-field field-header">
                        <p className="font-size-12">{field}</p>
                    </div>)
            }
        </div>
        projectElements.push(element);
    }
    return <div>{projectElements}</div>;
  }

  render() {
    return (
        <div>
            <div>
                <p className="font-size-24">{this.props.name}</p>
            </div>
            {this.renderHeaders()}
            {this.renderProjects()}
        </div>
    );
  }
}

export default ProjectRouter;

ProjectRouter.propTypes = {
    name: PropTypes.string
}
