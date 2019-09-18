'use strict';

const e = React.createElement;

class ProjectRouter extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<div>{this.props.name}</div>);
  }
}

const domContainer = document.querySelector('#project_router_babel');
ReactDOM.render(e(ProjectRouter), domContainer);