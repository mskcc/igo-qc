import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { getPickListValues } from './services/lims-service'
import { getNgsStatsData } from './services/ngs-stats-service';
import { getProjectInfo, getProjectQc } from './services/igo-qc-service';
import Graph from './components/graphs';
import QcTable from './components/qc-table';
import Summary from './components/summary';
import './app.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleRight, faAngleDown } from '@fortawesome/free-solid-svg-icons';

/**
 * This component renders the the QC page for a particular project. It is rendered based on the project ID (pId) passed
 * to its props
 *
 * @param props
 * @returns {*}
 * @constructor
 */
function App(props){
    const [recipe, setRecipe] = useState(null);
    const [ngsStatsData, setNgsStatsData] = useState([]);
    const [pickListValues, setPickListValues] = useState([]);
    const [projectInfo, setProjectInfo] = useState({});
    const [gridData, setGridData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [selectedSample, setSelectedSample] = useState('mocks'); // TODO - change this once real data available
    const [showNgsGraphs, setShowNgsGraphs] = useState(true);
    const [serviceErrors, setServiceErrors] = useState({});

    // pId should be passed in by the route
    const pId = props.match ? props.match.params.pid : '';
    // TODO - We need to fetch the recipe, which requires the projectMap. This should fire when projectMap is available
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

    useEffect(() => {
        if(!recipe) return;

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
            });
    }, [pId, recipe]); // NOTE: Intentionally not dependent on graphs b/c always different
    // TODO: this service response should be cached because it will always be the same.
    useEffect(() => {
        getPickListValues().then((data) => setPickListValues(data));
    }, [pId]);
    useEffect(() => {
        getProjectInfo(pId).then((data) => {
            setProjectInfo(data);
            setProjectInfoGridData(data);
            setProjectInfoHeaders(data);
        })
        .catch((err) => {
            const se = Object.assign({}, serviceErrors);
            // TODO - constant
            se['project-info'] = true;
            setServiceErrors(se);
        })
    }, [pId]);

    const handleToggle = () => {
        const wrapper = document.getElementById('wrapper');
        wrapper.classList.toggle('dropdown-open');
    };

    const toggleGraph = () => {
        setShowNgsGraphs(!showNgsGraphs);
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
            gridData.push(...rows);
            setGridData(gridData);
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

    const onSelect = (row) => {
        const selectedIgoId = row['IGO Id'];
        console.log(`Setting sample to ${selectedIgoId}`);
        setSelectedSample(selectedIgoId);
    };

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
            return <div>
                <p className={'text-align-center'}>Error loading NgsGraphs - contact streidd@mskcc.org</p>
            </div>
        }

        if(ngsStatsData.length === 0 &&
            (!projectInfo.chartsLinks || Object.keys(projectInfo.chartsLinks).length === 0)){
            return <div className={"black-border"}>
                <div className="loader margin-auto"></div>
            </div>
        };

        // const selected = ngsStatsData.filter(sample => sample.id === sampleId);
        if(ngsStatsData.length === 0) return <div></div>
        const sample = ngsStatsData[0];   // TODO - Undo once CellRanger data is available

        const graphs = sample.graphs || [];
        const chartsLinks = projectInfo.chartsLinks || {};
        const chartNames = Object.keys(chartsLinks);
        const sampleTitle = `Sample ${selectedSample} Graphs`;

        return <div>
            <div className={"pos-rel nav-container"} onClick={toggleGraph}>
                <div className={"margin-left-20 inline-block"}>
                    <p className={"text-align-center"}>Graphs</p>
                </div>
                <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                                 icon={showNgsGraphs ? faAngleDown : faAngleRight}/>
            </div>
            <div className={`${showNgsGraphs ? "dropdown-open" : "dropdown-closed"}`}>
                <div className={'graph-container'}>
                    <div className={'ngs-stats-graphs-container pos-rel inline-block'}>
                        <p className={"text-align-center font-bold em2"}>{sampleTitle}</p>
                        <div className={"table margin-auto"}>
                            {graphs.map((chart) => {
                                return <div key={chart.name} className='table-cell vertical-align-top'>
                                    <Graph chart={chart}></Graph>
                                </div>
                            })}
                        </div>
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
            return <div>
                <p className={'text-align-center'}>Error loading Project Info stats - contact streidd@mskcc.org</p>
            </div>
        }

        if(Object.keys(projectInfo).length === 0){
            return <div>
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
                         onSelect={onSelect}/>
            </div>;
    };

    return <div>
            {renderSummary(projectInfo)}
            {renderNgsGraphs(selectedSample)}
            {renderGrid(gridData,headers)}
        </div>;
}

export default App;

App.propTypes = {
    projectMap: PropTypes.object
};