import axios from "axios";

import config from '../config.js';

// MOCK RESPONSES
import GET_SEQ_ANALYSIS_SAMPLE_RESP from '../getRecentDeliveries_seqAnalysis.js';
import GET_RECENT_DELIVERIES_RESP from '../getRecentDeliveries_request.js';


const parseResp = (resp) => {
    const payload = resp.data
    return payload.data
}

/**
* Sends service call to retrieve most recent deliveries
*/
export function getSeqAnalysisProjects() {
    if(process.env.REACT_APP_STAGE){
        // TODO - add api call
        // TODO - Currently the same endpoint gives very different responses. See GetDelivered.java from GetRecentDeliveries.java
        // REQUEST: "/LimsRest/getRecentDeliveries"
        // Table: "SeqAnalysisSampleQC", Query: "DateCreated >  1484508629000 AND SeqQCStatus != 'Passed' AND SeqQCStatus not like 'Failed%'"
        return axios
            .get(config.IGO_QC + '/getSeqAnalysisProjects')
            .then(resp => {return parseResp(resp) })
            .catch(error => {throw new Error('Unable to fetch Seq Analysis Projects') });
    }
    return GET_SEQ_ANALYSIS_SAMPLE_RESP;
}

/**
 * Sends service call to retrieve most recent deliveries
 */
export function getRequestProjects() {
    if(process.env.REACT_APP_STAGE){
        // TODO - add api call
        // TODO - Currently the same endpoint gives very different responses. See GetDelivered.java from GetRecentDeliveries.java
        // REQUEST: "/LimsRest/getRecentDeliveries?time=2&units=d"
        // Table: "Request", Query: "RecentDeliveryDate > " + searchPoint + " AND (Investigatoremail = '" + investigator + "' OR LabHeadEmail = '" + investigator + "')"
        return axios
            .get(config.IGO_QC + '/getRequestProjects')
            .then(resp => { return parseResp(resp) })
            .catch(error => { throw new Error('Unable to fetch Request Projects') });
    }

    return GET_RECENT_DELIVERIES_RESP;
}