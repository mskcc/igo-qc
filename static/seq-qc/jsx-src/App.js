import LikeButton from './like_button.js';
import ProjectRouter from './project_router.js';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <ProjectRouter name="test"/>
  }
}

export default App;