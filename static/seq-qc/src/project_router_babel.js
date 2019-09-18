'use strict';

const e = React.createElement;

class ProjectRouter extends React.Component {
  constructor(props) {
    alert('ProjectRouter');
    super(props);
  }

  render() {
    return (
        <div>JSX Test</div>
    );
  }
}

const domContainer = document.querySelector('#project_router_babel');
ReactDOM.render(e(ProjectRouter), domContainer);