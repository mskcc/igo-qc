import axios from "axios";

import config from '../config.js';
import { handleError } from "../utils/service-utils";
import seqAnalysisProjects from '../mocks/getSeqAnalysisProjects.js';
import projectInfo from '../mocks/projectInfo';

const getData = (resp) => {
    const wrapper = resp.data || {};
    const data = wrapper.data || {};
    return data;
};
const parseResp = (resp) => {
    const payload = resp.data
    return payload.data
};

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
        .catch(error => { throw new Error('Unable to fetch Request Projects: ' + error) });
}
export const getProjectInfo = (projectId) => {
    return axios.get(`${config.IGO_QC}/projectInfo/${projectId}`)
        .then(getData)
        .catch(handleError)
};
export const setRunStatus = (run, project, status, recipe) => {
    return axios.get(`${config.IGO_QC}/changeRunStatus?recordId=${run}&project=${project}&status=${status}&recipe=${recipe}`)
        .then(getData)
        .catch(handleError)
};

/**
 * Sends service call to retrieve chart data about most recent runs
 */
export function getRecentRuns() {
    return axios
        .get(config.IGO_QC + '/getRecentRuns')
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to fetch Recent Runs: ' + error) });
}
