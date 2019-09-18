// TODO - When fully integrated
// import PropTypes from 'prop-types';

class ProjectRouter extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div>
            <p>{this.props.name}</p>
        </div>
    );
  }
}

export default ProjectRouter;

ProjectRouter.propTypes = {
    name: PropTypes.string
}
