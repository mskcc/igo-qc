// TODO - remove or make more robust
export const handleError = (err) => {
    console.error(err);
    throw new Error(err);
};


export const addServiceError = (type, serviceErrors, setServiceErrors) => {
    const se = Object.assign({}, serviceErrors);
    se[type] = true;
    setServiceErrors(se);
};

/**
 * Parses out data contained in expected API response.
 * 
 * @param resp
 * @returns {*|{}}
 */
export const getData = (resp) => {
    const wrapper = resp.data || {};
    const data = wrapper.data || {};
    return data;
};
