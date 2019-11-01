// TODO - remove or make more robust
export const handleError = (err) => {
    console.error(err);
    throw new Error(err);
};


export const addServiceError = (type, serviceErrors, setServiceErrors) => {
    const se = Object.assign({}, serviceErrors);
    se[type] = true;
    setServiceErrors(se);
}