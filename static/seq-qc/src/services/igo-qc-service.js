import axios from 'axios';

import config from '../config.js';
import { handleError, getData } from '../utils/service-utils';

// TODO - remove
const parseResp = (resp) => {
    const payload = resp.data
    return payload.data
};
export function getFeedback() {
    return axios
        .get(config.IGO_QC + '/getFeedback')
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to get Feedback: ' + error) });
}

/**
* Sends service call to retrieve most recent deliveries
*/
export function getSeqAnalysisProjects() {
    /* MOCK DATA - TODO: REMOVE */
    /*
    return new Promise((resolve) => { resolve(seqAnalysisProjects) })
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to fetch Seq Analysis Projects: ' + error) });
     */
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
    /* MOCK DATA - TODO: REMOVE */
    /*
    return new Promise((resolve) => { resolve(projectInfo) })
        .then(getData)
        .catch(handleError);
     */
    return axios.get(config.IGO_QC + `/projectInfo/${projectId}`)
        .then(getData)
        .catch(handleError)
};
export const setRunStatus = (run, project, status, recipe) => {
    return axios.get(`${config.IGO_QC}/changeRunStatus?recordId=${run}&project=${project}&status=${status}&recipe=${recipe}`)
        .then(getData)
        .catch(handleError)
};
export const submitFeedback = (body, subject, type) => {
    const content = { body, subject, type };
    return axios.post(`${config.IGO_QC}/submitFeedback`, content)
        .then(getData)
        .catch(handleError)
};

export const addComment = (projectId, commentText, username) => {
    const data = { projectId, commentText, username };
    return axios.post(`${config.IGO_QC}/addComment`, data)
            .then(getData)
            .catch(error => {throw new Error('Unable to add comment: ' + error) });
};

export const getComments = (projectId) => {
    return axios.get(`${config.IGO_QC}/getComments/${projectId}`)
    .then(resp => { return JSON.parse(parseResp(resp)) })
    .catch(error => {throw new Error('Unable to fetch comments: ' + error) });
}
/**
 * Sends service call to retrieve chart data about most recent runs
 */
export function getRecentRuns(numDays) {
    return axios
        .get( `${config.IGO_QC}/getRecentRuns?days=${numDays}`)
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to fetch Recent Runs: ' + error) });
}
export function saveConfig(type, value){
    return axios.post(config.IGO_QC + '/saveConfig', { type, value })
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Failed to log in: ' + error) });
}
