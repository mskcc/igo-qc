const e = React.createElement;

class ProjectRouter extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return e('div', { className: 'project-router' },
        e('p', { className: 'project-router-name' }, this.props.name)
    );
  }
}

/*
ProjectRouter.propTypes = {
    name: PropTypes.string
};
*/

export default ProjectRouter;