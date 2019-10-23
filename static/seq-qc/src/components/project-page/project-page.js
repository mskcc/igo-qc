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
import { CELL_RANGER_APPLICATION_COUNT, MODAL_ERROR } from "../../constants";

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
    const [projectInfo, setProjectInfo] = useState({});
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
        if(!recipe && (props.projectMap[pId] || Object.keys(projectInfo).length > 0)){
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

    useEffect(() => {
        if(!recipe) return;     // Recipe needs to be available, see "fetchRecipe" recipe

        getNgsStatsData(recipe, pId)
            .then((data) => {
                setNgsStatsGridData(data);
                setNgsStatsData(data);
            })
            .catch((err) => {
                const se = Object.assign({}, serviceErrors);
                // TODO - constant
                se['ngs-stats'] = true;
                setServiceErrors(se);
                props.addModalUpdate(MODAL_ERROR, 'Failed to fetch NgsGraphs');
            });
    }, [pId, recipe]); // NOTE: Intentionally not dependent on graphs b/c always different
    useEffect(() => {
        updateProjectInfo(pId);
    }, [pId]);

    /**
     * Submits request to retrieve data for project from the projectId
     *
     * @param pId, Project ID
     */
    const updateProjectInfo = (pId) => {
        getProjectInfo(pId).then((data) => {
            setProjectInfo(data);
            setGridInfo(data);
        })
        .catch((err) => {
            const se = Object.assign({}, serviceErrors);
            // TODO - constant
            se['project-info'] = true;
            props.addModalUpdate(MODAL_ERROR, 'Project Info: ' + err)
            setServiceErrors(se);
        })
    };

    /**
     * Populates rows, headers, etc. with data
     *
     * @param data
     */
    const setGridInfo = (data) => {
        setProjectInfoGridData(data);
        setProjectInfoHeaders(data);
    };

    /**
     * OnClick event that should toggle flag to show/unshow Ngs Graphs
     */
    const toggleGraph = () => { setShowNgsGraphs(!showNgsGraphs); };

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
            setGridData(rows);
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
            const projectInfoHeaders = grid.header || [];
            projectInfoHeaders.push.apply(projectInfoHeaders, headers);
            setHeaders(projectInfoHeaders);
        }
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

    // TODO - Add ngsStats data to the grid
    const setNgsStatsGridData = (ngsResp) => {
        if(ngsResp.length > 0){
            // Add Headers
            const ngsStatsHeaders = Object.keys(ngsResp[0]);
            // headers.push(...ngsStatsHeaders);
            // setHeaders(headers);

            // Add Rows
            // gridData.push(...ngsResp);
            // setGridData(gridData);
        }
    };

    const renderNgsGraphs = (sampleId) => {
        if(serviceErrors['ngs-stats']){
            return <div className={"black-border"}>
                <p className={'text-align-center'}>Error loading NgsGraphs - contact streidd@mskcc.org</p>
            </div>
        }
        if(ngsStatsData === null){
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

        const sample = ngsStatsData[0];   // TODO - Undo once CellRanger data is available
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
                    <div className={'ngs-stats-graphs-container pos-rel inline-block'}>
                        {
                            recipe === CELL_RANGER_APPLICATION_COUNT?
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
        if(serviceErrors['project-info']){
            return <div className={"black-border"}>
                <p className={'text-align-center'}>Error loading Project Info stats - contact streidd@mskcc.org</p>
            </div>
        }

        if(Object.keys(projectInfo).length === 0){
            return <div className={"black-border"}>
                <div className="loader margin-auto"></div>
            </div>
        };
        return <Summary requester={projectInfo.requester || {}}
                 statuses={projectInfo.statuses || {}}
                 projectType={projectInfo.projectType || {}}/>
    };

    const renderGrid = (gridData, headers) => {
        if(serviceErrors['project-info']){
            return <div>
                <p className={'text-align-center'}>Error loading Project Info stats - contact streidd@mskcc.org</p>
            </div>
        }

        const hideGrid = (gridData.length === 0 || headers.length === 0)
        const display = hideGrid ? 'block' : 'none';
        return <div className={"black-border"} style={{width:'inherit'}}>
            <div style={{ display, margin: 'auto' }} className="loader"></div>
                <QcTable data={gridData}
                         headers={headers}
                         qcStatuses={projectInfo.statuses || {}}
                         onSelect={onSelect}
                         project={pId}
                         recipe={recipe}
                         addModalUpdate={props.addModalUpdate}
                         updateProjectInfo={updateProjectInfo}/>
            </div>;
    };

    return <div>
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