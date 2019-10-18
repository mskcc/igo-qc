import axios from 'axios';
import PICK_LIST_RESP from '../mocks/getPickListValues'

import config from '../config.js';
import { handleError } from '../utils/service-utils';

const getProject = (resp) => {
    const data = resp.data || [];
    const project = data[0];
    return project;
};

export const getProjectQc = (projectId) => {
    // TODO - This should probably be by just project since "getProjectQc" request to LIMS rest only takes project
    return axios.get(`${config.LIMS_REST}/getProjectQc?project=${projectId}`)
                .then(getProject)
                .catch(handleError)
};

export const getPickListValues = () => {
    return new Promise((resolve) => resolve(PICK_LIST_RESP))
};