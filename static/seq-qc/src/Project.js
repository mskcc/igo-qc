function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Project = function Project(pi, type, requestId, recentRuns, date) {
    _classCallCheck(this, Project);

    this.pi = pi;
    this.type = type;
    this.requestId = requestId;
    this.recentRuns = recentRuns;
    this.date = date;
};

export default Project;