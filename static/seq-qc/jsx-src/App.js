import LikeButton from './like_button.js';
import ProjectRouter from './project_router.js';
import PRB from './project_router_babel.js';

const e = React.createElement;

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  /*
        e('script', { src: "static/seq-qc/src/project_router_babel.js",
                      type: "text/babel",
                      name: "Project Router" }, [])
  */

  render() {
    return e('div', {},
        e('div', { id: "project_router_babel"}, [] )
    );
  }
}

export default App;