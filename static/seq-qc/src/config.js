// REF - https://serverless-stack.com/chapters/environments-in-create-react-app.html
const dev = {
    IGO_QC: 'http://localhost:9009',            // socket uwsgi is set to serve from
    NGS_STATS: 'http://localhost:8080',
    LIMS_REST: 'http://localhost:5007'
};
const prod = {
    IGO_QC: 'http://localhost:9009',                                 // In production, client will be served from server
    NGS_STATS: 'http://localhost:8080',
    LIMS_REST: 'https://igolims.mskcc.org:8443/LimsRest'
};

const config = process.env.REACT_APP_STAGE === 'prod'
    ? prod
    : dev;

export default {
    ...config
};