// TODO - Configure based on env, like https://serverless-stack.com/chapters/environments-in-create-react-app.html
const dev = {
    IGO_QC: 'http://localhost:9009',            // socket uwsgi is set to serve from
    NGS_STATS: 'http://localhost:8080'
};
const prod = {
    IGO_QC: '',                                 // In production, client will be served from server
    NGS_STATS: 'http://delphi.mskcc.org:8080'
};

const config = process.env.REACT_APP_STAGE === 'production'
    ? prod
    : dev;

export default {
    ...config
};