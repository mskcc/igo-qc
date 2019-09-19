/**
 * Entity tracking state of an IGO project
 */
class Project {
    constructor(pi, requestType, requestId, run, date) {
        this.pi = pi;
        this.requestType = requestType;
        this.requestId = requestId;
        this.run = run;
        this.date = date;
    }
}

export default Project;