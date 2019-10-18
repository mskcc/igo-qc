import axios from 'axios';

import config from '../config.js';
import { handleError } from '../utils/service-utils';

const getData = (resp) => {
    const wrapper = resp.data || {};
    const data = wrapper.data || {};
    return data;
};

export const getProjectInfo = (projectId) => {
    return axios.get(`${config.IGO_QC}/projectInfo/${projectId}`)
        .then(getData)
        .catch(handleError)
};

export const getProjectQc = (projectId) => {
    // TODO - This should probably be by just project since "getProjectQc" request to LIMS rest only takes project
    return axios.get(`${config.IGO_QC}/getProjectQc/${projectId}`)
        .then(getData)
        .catch(handleError)
};