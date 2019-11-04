import axios from "axios";
import { handleError } from "../utils/service-utils";
import LZString from "lz-string";
import { preProcess } from '../utils/browser-utils';

import config from '../config.js';
import {CELL_RANGER_APPLICATION_COUNT, CELL_RANGER_APPLICATION_VDJ} from "../constants";

/**
 * Queries ngs-stats for additional data based on the recipe
 *
 * @param recipe
 * return Object[]
 */
export const getNgsStatsData = (recipe, projectId) => {
    if(recipe.includes(CELL_RANGER_APPLICATION_COUNT)) {
        // TODO - make "count" & "vdj" constants
        return getCellRangerData(projectId, "count");       // "count" maps to an ngs-stats endpoint
    } else if(recipe.includes(CELL_RANGER_APPLICATION_VDJ)) {
        return getCellRangerData(projectId, "vdj");
    }
    return new Promise((resolve) => resolve([]));
};

/**
 * PROCESSING FUNCTION: All cases in 'getNgsStatsData' should have a corresponding function below
 *
 * @param projectId
 * @param type, String - Constant expected by ngs-stats endpoint
 * @returns {Promise<AxiosResponse<T>>}
 */
const getCellRangerData = (projectId, type) => {
    return axios.get(`${config.NGS_STATS}/ngs-stats/getCellRangerSample?project=${projectId}&type=${type}`)
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
        // Parse out graph data if available
        const decompressedGraph = decompressGraphData(sample['CompressedGraphData']);
        sample.graphs = decompressedGraph;
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
