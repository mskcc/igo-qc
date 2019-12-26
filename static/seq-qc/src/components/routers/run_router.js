import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faFile } from '@fortawesome/free-solid-svg-icons'
import { getRecentRuns } from "../../services/igo-qc-service";
import config from '../../config.js';
import {MODAL_SUCCESS, MODAL_UPDATE} from "../../resources/constants";

/**
 * Router for Recent Runs
 */
const RunRouter = (props) => {
    const [numDays, setNumDays] = useState(7);
    const [tempNumDays, setTempNumDays] = useState(numDays);
    const [recentRuns, setRecentRuns] = useState(null);

    useEffect(() => {
        updateRecentRuns();
    }, []);

    /**
     * Submits request to obtain recent run information.
     *
     * @param range - Number of days from today to query for recent runs
     */
    async function updateRecentRuns(range = numDays) {
        try {
            const resp = await getRecentRuns(range);
            if(recentRuns){
                // Non-null "recentRuns" indicates page is being updated by user action, not initialized
                props.addModalUpdate(MODAL_SUCCESS, 'Updated Recent Runs');
            }
            setRecentRuns(resp.recentRuns || []);
        } catch(e) {
            console.error(e);
            setRecentRuns([]);
        }
    };

    /**
     * Helper function to return human readable name for laneBarcode file
     */
    const formatRunName = (htmlName) =>{
        if(!htmlName) return "";
        const name = htmlName.split("_laneBarcode.html")[0]
        return name;
    };

    /**
     * Renders table of projects
     */
    const renderTable = () => {
        const hasData = recentRuns && recentRuns.length > 0;
        const noData = recentRuns && recentRuns.length === 0;
        const loadingData = recentRuns === null;

        // Visualize projects if present and state has been populated w/ fields to visualize
        if(hasData){
            return <table className="project-table fill-width">
                {renderHeaders()}
                {renderRuns()}
            </table>
        } else if(noData) {
            return <div><p className={'text-align-center'}>No Runs available</p></div>
        } else if(loadingData){
            return <div className="loader margin-auto"></div>;
        } else {
            // Shouldn't ever be reached
            return <div><p className={'text-align-center'}>ERROR</p></div>
        }
    };

    const isValidRange = (n) => {
        const num = parseInt(n);
        if(!Number.isInteger(num)) return false;
        if(num < 1) return false;
        return true;
    };

    const renderHeaders = () => {
        const headers = ["Lane Name", "Date", "Lane Summary", "Run Stats"];

        return <thead><tr className="fill-width">
            { headers.map( (field) =>
                <th className="project-field" key={field}>
                    <p className="font-size-16 font-bold">{field}</p>
                </th>)
            }
        </tr></thead>;
    };

    const renderRuns = () => {
        const runElements = [];
        for( const run of recentRuns ){
            const name = formatRunName(run.runName);
            const element = <tr className="fill-width project-row" key={run['runName']}>
                <td className="project-field field-header text-align-center" key={`${name}-href`}>
                    <p>{ name }</p>
                </td>
                <td className="project-field field-header text-align-center" key={`${run['runName']}-date`}>
                    <p>{run.date}</p>
                </td>
                <td className="project-field field-header text-align-center" key={`${name}-lane-summary`} target="_blank">
                    <button className="btn btn-primary run-info-button">
                        <a href={`/seq-qc/${run.path}`} target="_blank">
                            <FontAwesomeIcon className="em5 mskcc-light-blue" icon={faFile}/>
                        </a>
                    </button>
                </td>
                <td className={"text-align-center"}>
                    <button className="btn btn-primary run-info-button">
                        <a href={`${config.SITE_HOME}${run['runStats']}`} target="_blank">
                            <FontAwesomeIcon className="em5 mskcc-light-blue" icon={faChartBar}/>
                        </a>
                    </button>
                </td>
            </tr>;
            runElements.push(element);
        }
        return <tbody>{runElements}</tbody>;
    };

    /**
     * Renders Update Button to return runs from a different date range
     *
     * @returns {*}
     */
    const renderRunUpdateBtn = () => {
        const showUpdateBtn = isValidRange(tempNumDays) && (numDays !== tempNumDays);
        if(showUpdateBtn){
            return <div className={"btn-info width-80px pos-rel inline-block float-right text-align-center hover"}
                 onClick={() => {
                     props.addModalUpdate(MODAL_UPDATE, `Querying Recent Runs from past ${tempNumDays} days`);
                     setNumDays(tempNumDays);
                     updateRecentRuns(tempNumDays);
                 }}>
                <p>Update</p>
            </div>
        }
        return <div></div>
    };

    return (
        <div>
            <div className={"box height-50px inline-block"}>
                <div className={"width-300px pos-rel inline-block text-align-center"}>
                    <label className={"inline-block"}>
                        <p className={"inline-block"}>Query from past</p>
                        <input className={"width-50px inline-block margin-left-10"}
                               type="text"
                               value={tempNumDays}
                               onChange={(evt) => setTempNumDays(evt.target.value)}/>
                        <p className={"inline-block margin-left-10"}>Days</p>
                    </label>
                </div>
                { renderRunUpdateBtn() }
            </div>
            {renderTable()}
        </div>
    );
};

export default RunRouter;

RunRouter.propTypes = {
    addModalUpdate: PropTypes.func
};
