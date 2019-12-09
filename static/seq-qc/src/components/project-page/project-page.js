import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { getNgsStatsData } from '../../services/ngs-stats-service';
import { getProjectInfo } from '../../services/igo-qc-service.js';
import QcTable from './components/qc-table';
import Summary from './components/summary';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleRight, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import CellRangerCount from "./graph-types/cellranger-count";
import CellRangerVdj from "./graph-types/cellranger-vdj";
import { CELL_RANGER_APPLICATION_COUNT, MODAL_ERROR, NGS_HEADERS_TO_REMOVE, NGS_STATS, PROJECT_INFO } from "../../resources/constants";
import { addServiceError } from '../../utils/service-utils';

/**
 * This component renders the the QC page for a particular project. It is rendered based on the project ID (pId) passed
 * to its props
 *
 * @param props
 * @returns {*}
 * @constructor
 */
function ProjectPage(props){
    // TODO - pass props of ngsStatsData/projectInfo in for caching
    const [recipe, setRecipe] = useState(null);
    const [ngsStatsData, setNgsStatsData] = useState(null);
    const [projectInfo, setProjectInfo] = useState(null);           // This should initially be null - indicates loading
    const [gridData, setGridData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [selectedSample, setSelectedSample] = useState('mocks'); // TODO - change this once real data available
    const [showNgsGraphs, setShowNgsGraphs] = useState(false);
    const [serviceErrors, setServiceErrors] = useState({});

    const pId = props.match ? props.match.params.pid : '';  // pId should be passed in by the route

    /**
     * Fetches recipe if not currently available using the pId
     *
     *   If,
     *      recipe is available,                                                         DO NOTHING, WAIT
     *      recipe/projectInfo isn't available and projectInfo data has not been cached  DO NOTHING, WAIT
     *      recipe isn't available and cached response is available                      TAKE RECIPE FROM CACHE
     *      recipe isn't available and projectInfo is available                          TAKE RECIPE FROM PROJECT_INFO
     *
     * @param pId
     */
    const fetchRecipe = (pId) => {
        if(!recipe && (props.projectMap[pId] || (projectInfo && Object.keys(projectInfo).length > 0))){
            if(props.projectMap[pId]){
                setRecipe(props.projectMap[pId]['recipe']);
            }
            else if(Object.keys(projectInfo).length > 0){
                const projectType = projectInfo['projectType'];
                const recipe = projectType['recipe'];
                setRecipe(recipe);
            }
        }
    };
    fetchRecipe(pId);   // Conditionally fetches the recipe if unavailable

    /* Add all actions that should reset on new project id */
    useEffect(() => {
        let isSubscribed = true;

        // TODO - Unsubscribe from all service calls in useEffecs
        queryProjectInfo(pId);

        // isSubscribed
        return () => { isSubscribed = false; };
    }, [pId]);
    useEffect(() => {
        if(!recipe) return () => {};     // Recipe needs to be available, see "fetchRecipe" recipe
        queryNgsStatsData(recipe, pId)
        return () => {};
    }, [pId, recipe]); // NOTE: Intentionally not dependent on graphs b/c always different

    /**
     *  These are seperated from the service calls that set ngsStatsData & projectInfo because of issues accessing
     *  the updated state within the effect function.
     *      i.e. queryProjectInfo update to gridData would not be available to queryNgsStatsData update to gridData
     */
    useEffect(() => {
        // Add any effects that should occur when ngsStatsData changes
        updateNgsStatsData(ngsStatsData);
    }, [ngsStatsData]);
    useEffect(() => {
        // Add any effects that should occur when projectInfo changes
        updateProjectInfo(projectInfo);
    }, [projectInfo]);

    /**
     * Submits a request to retrieve ngsStatsData
     *
     * Sets ngsStatsData in component
     */
    const queryNgsStatsData = (recipe, pId) => {
        getNgsStatsData(recipe, pId).then((data) => {
            setNgsStatsData(data);
        })
        .catch((err) => {
            addServiceError(NGS_STATS, serviceErrors,setServiceErrors);
            props.addModalUpdate(MODAL_ERROR, 'Ngs Stats Data' + err);
        });
    };
    /**
     * Submits request to retrieve data for project from the projectId
     *
     * @param pId, Project ID
     */
    const queryProjectInfo = (pId) => {
        getProjectInfo(pId).then((data) => {
            setProjectInfo(data);
        })
        .catch((err) => {
            addServiceError(PROJECT_INFO,serviceErrors,setServiceErrors);
            props.addModalUpdate(MODAL_ERROR, 'Project Info: ' + err);
        })
    };

    /**
     * Populates rows, headers, etc. with data
     *
     * @param data
     */
    // TODO - Make this generic for ngsStats and regular headers
    const updateProjectInfo = (data) => {
        if(!data || Object.keys(data).length == 0) return;
        setProjectInfoGridData(data);
        setProjectInfoHeaders(data);
    };
    /**
     * Adds the ProjectInfo rows to the rendered grid.
     *
     * @param projectInfo
     */
    const setProjectInfoGridData = (projectInfo) => {
        const gridObject = projectInfo.grid;
        if(gridObject){
            const grid = gridObject.grid || {};
            const rows = Object.values(grid);
            setNewGridData(rows);
            setSelectedSample(rows[0]['IGO Id']);
        }
    };
    /**
     * Adds ProjectInfoHeaders. These should be the first headers
     *
     * @param projectInfo
     */
    const setProjectInfoHeaders = (projectInfo) => {
        const grid = projectInfo.grid;
        if(grid){
            setNewHeaders(grid.header);
        }
    };

    /**
     * This should update the headers/gridData when there is a service call update to ngsStatsData.
     *
     * Affected State fields:
     *      - headers
     *      - gridData
     *      - selectedSample
     *
     * @param ngsResp, Object[]
     */
    const updateNgsStatsData = (ngsResp) => {
        if(!ngsResp) return;
        if(ngsResp.length > 0){
            const ngsHeaders = Object.keys(ngsResp[0]);
            const filtered_headers = ngsHeaders.filter((header) => {
                const include = !(NGS_HEADERS_TO_REMOVE.indexOf(header) >= 0);
                return include;
            });
            setNewHeaders(filtered_headers);

            const newGridData = [];
            for (const entry of ngsResp){
                const clone = {};
                for (const header of filtered_headers){
                    clone[header] = entry[header];
                }
                newGridData.push(clone);
            }

            const updated = setNewGridData(newGridData);
            setSelectedSample(updated[0]['IGO Id']);
        }
    };

    /**
     * Safe way set headers. Considers if headers are populated from another source
     */
    const setNewHeaders = (newHeaders = []) => {
        if(headers.length > 0){
            // Add any new headers that may come from another source
            for(const toAdd of headers){
                // On update, update contains redundant columns already in headers. These shouldn't be added.
                if(!newHeaders.includes(toAdd)){
                    newHeaders.push(toAdd);
                }
            }
        }
        setHeaders(newHeaders);
    };
    /**
     * Safe way to set new grid data if grid data has already been populated by another source.
     */
    const setNewGridData = (newData) => {
        if(shouldJoinNewData(newData)){
            const newGridData = gridData.slice(0);
            for(const newEntry of newData){
                joinNewEntry(newEntry, gridData);
            }
            setGridData(newGridData);
            return newGridData
        }
        setGridData(newData);
        return newData;
    };

    const shouldJoinNewData = (newData) => {
        // No existing data to join
        if(gridData.length === 0 || newData.length === 0) return false;

        // Check for update, i.e. newData & gridData all contain the same fields
        const currentFields = Object.keys(gridData[0]);
        const newFields = Object.keys(newData[0]);
        for(const f of currentFields){
            if(!newFields.includes(f)) return true;
        }
        for(const f of newFields){
            if(!currentFields.includes(f)) return true;
        }

        return false;
    };

    /**
     * On select of row in child component, QcTable, this should be invoked to set selectedSample in this component.
     *
     * @param row, Object
     */
    const onSelect = (row) => {
        const selectedIgoId = row['IGO Id'];
        setSelectedSample(selectedIgoId);
    };

    /**
     * OnClick event that should toggle flag to show/unshow Ngs Graphs
     */
    const toggleGraph = () => { setShowNgsGraphs(!showNgsGraphs); };

    /**
     * Modifies the gridData object in line
     *
     * @param query
     * @param currentGridData
     */
    const joinNewEntry = (query, currentGridData) => {
        // entry should have
        const ngsDataName = query['Name'];
        const projectInfoId = query['IGO Id'];

        let match = [];
        if(ngsDataName){
            /* New Data comes from NGS STATS */
            // Find the current Grid Data entry that has that igo Id
            const matches = currentGridData.filter((entry) => ngsDataName.includes(entry['IGO Id']));
            if(matches.length === 1){
                match = matches;
            }
            else if(matches.length > 1){
                /* Resolve case of >1 match. - Choose the longer match
                    E.g.
                       ngsDataName = Sample_LN9_IGO_10243_B_10__count
                       entries: {
                              e['IGO Id'] : IGO Id: "10243_B_10",           <- Selected Match
                              e['IGO Id'] : IGO Id: "10243_B_1"
                   }
                 */
                const reducer = (best, current) => {
                    const bestId = best['IGO Id'] || '';
                    const currentId = current['IGO Id'] || '';
                    if(bestId.length > currentId.length) return best;
                    return current;
                };
                match = [matches.reduce(reducer, {})];
            }
        } else if(projectInfoId){
            /* New Data comes from IGO LIMS */
            match = currentGridData.filter((entry) => entry['name'].includes(projectInfoId));
        } else {
            throw new Error('No matching sample found for entry: ' + query.keys());
        }
        // Only one match should be found
        if(match.length == 1){
            // Update the value of the current entry in the grid data - this should later be set by the state
            let currentEntry = match[0];
            for(const key of Object.keys(query)){
                if(query[key]){
                    currentEntry[key] = query[key];
                }
            }
        }
    };

    const renderNgsGraphs = (sampleId) => {
        if(serviceErrors[NGS_STATS]){
            return <div className={"black-border"}>
                <p className={'text-align-center'}>Error loading NgsGraphs - Please submit a bug report using the "Feedback" button in the top-right corner</p>
            </div>
        }
        if(ngsStatsData === null || projectInfo === null){
            return <div className={"black-border"}>
                <div className="loader margin-auto"></div>
            </div>
        };
        if( ngsStatsData.length === 0 &&
            Object.keys(projectInfo.chartsLinks || []).length === 0) {
            return <div className={"black-border"}>
                        <p className={'text-align-center'}>No Graph data is available for this project</p>
                   </div>;
        }

        const filtered = ngsStatsData.filter((entry) => entry.Name.includes(selectedSample));
        let sample = {};
        if(filtered.length > 0){
            sample = filtered[0];
        }
        const graphs = sample.graphs || [];
        const chartsLinks = projectInfo.chartsLinks || {};
        const chartNames = Object.keys(chartsLinks);
        const title = `Sample ${selectedSample} Graphs`;

        return <div>
            <div className={"pos-rel nav-container"} onClick={toggleGraph}>
                <div className={"margin-left-10 inline-block"}>
                    <p className={"text-align-center"}>Graphs</p>
                </div>
                <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                                 icon={showNgsGraphs ? faAngleDown : faAngleRight}/>
            </div>
            <div className={`${showNgsGraphs ? "dropdown-open" : "dropdown-closed"}`}>
                <div className={'graph-container'}>
                    <div>
                        <p className={"text-align-center font-bold em2"}>{title}</p>
                    </div>
                    <div className={'ngs-stats-graphs-container pos-rel inline-block'}>
                        {
                            // TODO - Put this into a util function since it is used in many places
                            recipe.includes(CELL_RANGER_APPLICATION_COUNT)?
                                <CellRangerCount title={title}
                                                 graphs={graphs}/>
                        :
                                <CellRangerVdj title={title}
                                               graphs={graphs}/>
                        }
                    </div>
                    { chartNames.length > 0 ?
                        <div className={'charts-links-container vertical-align-top inline-block'}>
                            <div>
                                <p className={"text-align-center font-bold em2"}>Project Graphs</p>
                            </div>
                            <div>
                                {chartNames.map((name)=>{
                                    return<p>
                                        <a href={chartsLinks[name]} target="_blank">{name}</a>
                                    </p>
                                })}
                            </div>
                        </div>
                        :
                        <div></div>}
                </div>
            </div>
        </div>
    };

    const renderSummary = (projectInfo) => {
        if(serviceErrors[PROJECT_INFO]){
            return <div className={"black-border"}>
                <p className={'text-align-center'}>Error loading Project Info stats - Please submit a bug report using the "Feedback" button in the top-right corner</p>
            </div>
        }
        if(!projectInfo){
            return <div className={"black-border"}>
                <div className="loader margin-auto"></div>
            </div>
        }
        return <Summary requester={projectInfo.requester || {}}
                 statuses={projectInfo.statuses || {}}
                 projectType={projectInfo.projectType || {}}/>
    };

    const getColumnOrder = () => {
        // If ngsStatsData is available, take from it
        if(ngsStatsData && Object.keys(ngsStatsData).length > 0){
            const ngsHeaders = Object.keys(ngsStatsData[0]);
            const filtered = ngsHeaders.filter((header) => !NGS_HEADERS_TO_REMOVE.includes(header));
            filtered.unshift('QC Status');
            return filtered;
        }

        if(!projectInfo) return [];
        return projectInfo.columnOrder || [];
    };

    const renderGrid = (gridData, headers) => {
        if(serviceErrors[PROJECT_INFO]){
            return <div>
                <p className={'text-align-center'}>Error loading Project Info stats - Please submit a bug report using the "Feedback" button in the top-right corner</p>
            </div>
        }

        const hideGrid = (gridData.length === 0 || headers.length === 0)
        const display = hideGrid ? 'block' : 'none';

        const columnOrder = getColumnOrder();

        const qcStatuses = projectInfo ? projectInfo.statuses || {} : {};

        return <div className={"black-border"} style={{width:'inherit'}}>
            <div style={{ display, margin: 'auto' }} className="loader"></div>
                <QcTable data={gridData}
                         headers={headers}
                         columnOrder={columnOrder || []}
                         qcStatuses={qcStatuses}
                         onSelect={onSelect}
                         project={pId}
                         recipe={recipe}
                         addModalUpdate={props.addModalUpdate}
                         updateProjectInfo={queryProjectInfo}
                         selectedSample={selectedSample}/>
            </div>;
    };

    // Return a message to indicate no data - projectInfo is required to load the page & ngsStats information
    if(projectInfo && Object.keys(projectInfo).length === 0){
        return <div className={"black-border"}>
            <p className={'text-align-center'}>No data is available - Piccard stats need to be run</p>
        </div>
    };
    return <div className={"margin-bottom-75"} key={pId}>
            {renderSummary(projectInfo)}
            {renderNgsGraphs(selectedSample)}
            {renderGrid(gridData,headers)}
        </div>;
}

export default ProjectPage;

ProjectPage.propTypes = {
    projectMap: PropTypes.object,
    addModalUpdate: PropTypes.func
};
