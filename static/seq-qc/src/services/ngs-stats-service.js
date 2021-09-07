import axios from "axios";
import {getData, handleError} from "../utils/service-utils";
import LZString from "lz-string";
import { preProcess } from '../utils/browser-utils';

import config from '../config.js';
import {CELL_RANGER_APPLICATION_COUNT, CELL_RANGER_APPLICATION_VDJ} from "../resources/constants";
import {downloadHtml} from "../utils/other-utils";

/**
 * Returns the fingerprint data for an input list of projects
 *
 * @param projects, String[]
 * @returns {Promise<AxiosResponse<T>>}
 *      e.g. {
 *          data: {
 *              [PROJECT_KEY]: {...},
 *              ...
 *          }
 *      }
 */
export const getCrosscheckMetrics = (projects) => {
    const projectList = projects.join(',');
    return axios.get(`${config.IGO_QC}/getCrosscheckMetrics?projects=${projectList}`)
        .then(getData)
        .catch(handleError)
};

/**
 * Returns promise of request sent to ngs-stats for the excel sheet of a run
 *
 * @param run
 * @returns {Promise<AxiosResponse<T>>}
 */
export const getPicardRunExcel = (run) => {
    return axios.get(`${config.NGS_STATS}/ngs-stats/get-picard-run-excel/${run}`)
};

/**
 * Queries ngs-stats for additional data based on the recipe
 *
 * @param recipe
 * return Object[]
 */
export const getNgsStatsData = (recipe, projectId) => {
    /* MOCK DATA - TODO: REMOVE */
    /*
    return new Promise((resolve) => resolve(cellRangerResp))
        .then(processCellRangerResponse)
        .catch(handleError)
    */
    const mappedType = mapCellRangerRecipe(recipe);
    if(mappedType){
        return getCellRangerData(projectId, mappedType);       // "count" maps to an ngs-stats endpoint
    }
    return new Promise((resolve) => resolve([]));
};

/**
 * Downloads the webSummary.html file of the specified parameters
 *
 * @param type,     e.g. "count"
 * @param sample,   e.g. "SC16
 * @param igoId,    e.g. "IGO_09335_O_1"
 * @param project,  e.g. "09335_O"
 * @param run
 * @returns {Promise<String>}
 */
export const downloadNgsStatsFile = (type, sample, igoId, project, run, download=true) => {
    // e.g. [ "SC16-UN", "IGO_09335_O_1" ] => "SC16-UN_IGO_09335_O_1"
    sample = `${sample}_IGO_${igoId}`
    return axios.get(config.IGO_QC + `/ngsStatsDownload?type=${type}&sample=${sample}&project=${project}&run=${run}&download=${download}`)
        .then(res => {
            const payload = res['data'] || {};
            const data = payload['data'];
            downloadHtml(data, sample)
            return data;
        })
        .catch(handleError)
};

/**
 * Returns the CellRanger output type taht the input IGO recipe should map to
 *
 * @param recipe
 * @returns {string|null}
 */
export const mapCellRangerRecipe = (recipe) => {
    if(recipe.includes(CELL_RANGER_APPLICATION_COUNT)) {
        // TODO - make "count" & "vdj" constants
        return "count"       // "count" maps to an ngs-stats endpoint
    } else if(recipe.includes(CELL_RANGER_APPLICATION_VDJ)) {
        return "vdj";
    }
    return null;
};

/**
 * PROCESSING FUNCTION: All cases in 'getNgsStatsData' should have a corresponding function below
 *
 * @param projectId
 * @param type, String - Constant expected by ngs-stats endpoint
 * @returns {Promise<AxiosResponse<T>>}
 */
const getCellRangerData = (projectId, type) => {
    return axios.get(`${config.IGO_QC}/getCellRangerSample?project=${projectId}&type=${type}`)
        .then(processCellRangerResponse)
        .catch(handleError)
};

/**
 * Parses out relevant fields from cell-ranger response
 *
 * @param resp
 * @returns {*|{}}
 */
const processCellRangerResponse = (resp) => {
    const wrapper = resp.data || {};
    const data = wrapper.data || [];
    for(const sample of data) {
        // TODO - As of the new cell-ranger update, the graph data can't be parsed from the web_summary.html the usual way
        // Parse out graph data if available
        const compressedGraphData = sample['CompressedGraphData'];
        if(compressedGraphData && compressedGraphData !== "" && compressedGraphData.length > 100){
            const decompressedGraph = decompressGraphData(sample['CompressedGraphData']);
            sample.graphs = decompressedGraph;
        } else {
            sample.graphs = [];
        }
    }
    return data;
};
/**
 * Decompresses string of decompressed data for graphs taken directly from web_summary.html page
 *
 * @param compressedGraphData, String
 * @returns {[]}
 */
const decompressGraphData = (compressedGraphData) => {
    let graphs = [];
    if(compressedGraphData) {
        const decompressedString = LZString.decompressFromEncodedURIComponent(compressedGraphData);
        // NOTE: '.parse' creates a new object/ref. If graphs becomes a state/prop, check value-equality in update logic
        const json = JSON.parse(decompressedString);
        const graphData = preProcess(json);
        graphs = graphData['charts']
            // TODO - Table cannot be displayed as a Plot.ly chart
            .filter((chart) => {
                return !chart.table && chart.name !== 'differential_expression'
            });
    }
    return graphs;
};
