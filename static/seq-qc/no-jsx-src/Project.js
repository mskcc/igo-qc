function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Entity tracking state of an IGO project
 */
var Project = function Project(pi, requestType, requestId, run, date) {
    _classCallCheck(this, Project);

    this.pi = pi;
    this.requestType = requestType;
    this.requestId = requestId;
    this.run = run;
    this.date = date;
};

export default Project;