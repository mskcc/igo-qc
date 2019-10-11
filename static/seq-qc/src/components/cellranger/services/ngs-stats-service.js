import axios from "axios";
import { handleError } from "../utils/service-utils";
import LZString from "lz-string";
import { preProcess } from '../utils/browser-utils';

import config from '../config.js';

/**
 * Queries ngs-stats for additional data based on the recipe
 *
 * @param recipe
 * return Object[]
 */
export const getNgsStatsData = (recipe, projectId) => {
    // TODO - Remove once data is available
    return getCellRangerData(projectId);

    switch(recipe) {
        // TODO - Should be like 10x
        // TOOD - Put in constant
        case 'cell-ranger':
            return getCellRangerData(projectId);
        default:
            break;
    }
    return new Promise((resolve) => resolve([]));
};

const getCellRangerData = (projectId) => {
    // TODO - This should probably be by just project since "getProjectQc" request to LIMS rest only takes project
    // TODO - Add Back
    // TODO - Take project & type as params
    return axios.get(`${config.NGS_STATS}/getCellRangerSample?project=cellranger&type=vdj`)
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
