import config from '../config';
import axios from 'axios';

export const QC_AXIOS = axios.create({
    baseURL: `${config.IGO_QC}`
});

const accessTokenHandler = (request) => {
    const token = sessionStorage.getItem('access_token');
    if (token && token !== "undefined") {
        request.headers['Authorization'] = `Bearer ${token}`;
    }
    return request;
};

const refreshTokenHandler = (request) => {
    const token = sessionStorage.getItem('refresh_token');
    if (token && token !== "undefined") {
        request.headers['Authorization'] = `Bearer ${token}`;
    }
    return request;
};

export const axiosInstance = (baseURL, type) => {
    const instance = axios.create({baseURL});

    let tokenHandler = accessTokenHandler;
    if(type === 'refresh') {
        tokenHandler = refreshTokenHandler;
    }

    instance.interceptors.request.use(request => tokenHandler(request));

    return instance;
};

QC_AXIOS.interceptors.request.use(
    request => accessTokenHandler(request)
);
