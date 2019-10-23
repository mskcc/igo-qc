import axios from 'axios';

import config from '../config.js';
import { handleError } from '../utils/service-utils';

import projectInfo from '../mocks/projectInfo';

const getData = (resp) => {
    const wrapper = resp.data || {};
    const data = wrapper.data || {};
    return data;
};

export const getProjectInfo = (projectId) => {
    return new Promise((resolve) => resolve(projectInfo))
        .then(getData)
        .catch(handleError);

    return axios.get(`${config.IGO_QC}/projectInfo/${projectId}`)
        .then(getData)
        .catch(handleError)
};

export const setRunStatus = (run, project, status, recipe) => {
    return axios.get(`${config.IGO_QC}/changeRunStatus?recordId=${run}&project=${project}&status=${status}&recipe=${recipe}`)
            .then(getData)
            .catch(handleError)
};