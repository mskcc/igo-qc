import axios from "axios";
import config from '../config.js';

import seqAnalysisProjects from '../components/project-page/mocks/getSeqAnalysisProjects.js';

const parseResp = (resp) => {
    const payload = resp.data
    return payload.data
};

/**
* Sends service call to retrieve most recent deliveries
*/
export function getSeqAnalysisProjects() {
    // TODO
    return new Promise((resolve) => resolve(seqAnalysisProjects))
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to fetch Seq Analysis Projects: ' + error) });

    return axios
        .get(config.IGO_QC + '/getSeqAnalysisProjects')
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to fetch Seq Analysis Projects: ' + error) });
}

/**
 * Sends service call to retrieve most recent deliveries
 */
export function getRequestProjects() {
    return axios
        .get(config.IGO_QC + '/getRequestProjects')
        .then(resp => { return parseResp(resp) })
        .catch(error => { throw new Error('Unable to fetch Request Projects: ' + error) });
}

/**
 * Sends service call to retrieve chart data about most recent runs
 */
export function getRecentRuns() {
    return axios
        .get(config.IGO_QC + '/getRecentRuns')
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to fetch Recent Runs: ' + error) });
}