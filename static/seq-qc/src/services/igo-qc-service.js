import axios from "axios";

import config from '../config.js';
import { handleError } from "../utils/service-utils";
import { QC_AXIOS, axiosInstance } from "./axios-util";

const getData = (resp) => {
    const wrapper = resp.data || {};
    const data = wrapper.data || {};
    return data;
};
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
    return axios.get(`${config.IGO_QC}/projectInfo/${projectId}`)
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

/**
 * Sends service call to retrieve chart data about most recent runs
 */
export function getRecentRuns() {
    return axios
        .get(config.IGO_QC + '/getRecentRuns')
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Unable to fetch Recent Runs: ' + error) });
}
export function refresh() {
    const instance = axiosInstance(config.IGO_QC, 'refresh');
    return instance.get(`/refresh`)
        .then(getData)
        .catch((err) => {
            const resp = err.response || {};
            const status = resp.status || null;
            // Unauthorized token - return empty to allow for refreshtoken
            if(status === 401){
                return {}
            }
            handleError(err);
        })
}
export function authenticate(username,password) {
    return axios.post(config.IGO_QC + '/authenticate', { username, password })
        .then(resp => {return parseResp(resp) })
        .catch(error => {throw new Error('Failed to log in: ' + error) });
}
