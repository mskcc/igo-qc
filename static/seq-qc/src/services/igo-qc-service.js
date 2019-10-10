import axios from "axios";

import config from '../config.js';

const parseResp = (resp) => {
    const payload = resp.data
    return payload.data
}

/**
* Sends service call to retrieve most recent deliveries
*/
export function getSeqAnalysisProjects() {
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
        .catch(error => { throw new Error('Unable to fetch Request Projects') });
}