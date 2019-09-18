import LikeButton from './like_button.js';
import ProjectRouter from './project_router.js';

const e = React.createElement;

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount () {
      const script = document.createElement("script");
      script.src = "static/seq-qc/src/project_router_babel.js";
      script.type = "text/babel";
      document.body.appendChild(script);
  }
  render() {
    return e('div', {},
        e('div', { id: "project_router_babel"}, [] )
    );
  }
}

export default App;