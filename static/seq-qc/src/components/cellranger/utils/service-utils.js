// TODO - remove or make more robust
export const handleError = (err) => {
    console.error(err);
    throw new Error(err);
    return [];
};