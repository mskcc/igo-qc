import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faFile } from '@fortawesome/free-solid-svg-icons'

import config from '../../config.js';

/**
 * Router for Recent Runs
 */
const RunRouter = (props) => {
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

    const formatRunName = (htmlName) =>{
        if(!htmlName) return "";

        const name = htmlName.split("_laneBarcode.html")[0]
        return name;
    };

    const renderRuns = () => {
        const runElements = [];
        for( const run of props.projects ){
            const name = formatRunName(run.runName);
            const element = <tr className="fill-width project-row" key={run.requestId}>
                <td className="project-field field-header text-align-center" key={`${name}-href`}>
                    <p>{ name }</p>
                </td>
                <td className="project-field field-header text-align-center" key={`${run.requestId}-date`}>
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
                        <a href={`${config.SITE_HOME}${run.runStats}`} target="_blank">
                            <FontAwesomeIcon className="em5 mskcc-light-blue" icon={faChartBar}/>
                        </a>
                    </button>
                </td>
            </tr>;
            runElements.push(element);
        }
        return <tbody>{runElements}</tbody>;
    };

    const hasData = () => {return props.projects && props.projects.length > 0};
    const noData = () => {return props.projects && props.projects.length === 0};
    const loadingData = () => {return props.projects === null;};
    const renderTable = () => {
        // Visualize projects if present and state has been populated w/ fields to visualize
        if(hasData()){
            return <table className="project-table fill-width">
                {renderHeaders()}
                {renderRuns()}
            </table>
        } else if(noData()) {
            return <div><p className={'text-align-center'}>No Runs available</p></div>
        } else if(loadingData()){
            return <div className="loader margin-auto"></div>;
        } else {
            // Shouldn't ever be reached
            return <div><p className={'text-align-center'}>ERROR</p></div>
        }
    };

    return (
        <div>
            {renderTable()}
        </div>
    );
};

export default RunRouter;

RunRouter.propTypes = {
    projects: PropTypes.array
};
