import LikeButton from './like_button.js';
import ProjectRouter from './project_router.js';
import Project from './Project.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        projects: []
    }
  }

  componentDidMount() {
    this.init();
  }

  init() {
    this.setProjects();
  }

  setProjects() {
    const projectResp = this.getProjects();
    const projects = projectResp.map(p => new Project(p.pi, p.type, p.requestId, p.recentRuns, p.date));

    this.setState({ projects })
  }

  getProjects() {
    // TODO - replace w/ service call
    const projects = [
        {
            pi: 'Watson',
            type: 'HemePact',
            requestId: 'id_100101',
            recentRuns: 'recentRuns',
            date: 'dateOfLatestStats'
        },
        {
            pi: 'Crick',
            type: 'WES',
            requestId: 'id_100101',
            recentRuns: 'recentRuns',
            date: 'dateOfLatestStats'
        },
    ];

    return projects;
  }

  render() {
    return <div className="router-container">
        <ProjectRouter name="Needs Review" projects={this.state.projects}/>
        <ProjectRouter name="Requires Further Sequencing" projects={this.state.projects}/>
        <ProjectRouter name="Recent Deliveries" projects={this.state.projects}/>
    </div>
  }
}

export default App;