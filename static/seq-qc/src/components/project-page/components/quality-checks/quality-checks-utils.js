import {CROSSCHECK_METRICS_FLAG_ERROR, CROSSCHECK_METRICS_FLAG_WARNING} from "../../../../resources/constants";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck, faEllipsisH, faExclamationCircle, faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import {SET_PROJECTS} from "../../../../redux/actionTypes";

/**
 * Does logic to parse out flag information to visualize in table cell
 *
 * @param flagField, { FLAG_TYPE: String, ... }
 * @returns {*}
 */
export const getFlagIcon = (flagField) => {
    if(flagField && Object.keys(flagField).length > 0){
        const flags = Object.keys(flagField);
        const errorFlags = flags.filter((f) => {return flagField[f] === CROSSCHECK_METRICS_FLAG_ERROR});
        const warningFlags = flags.filter((f) => {return flagField[f] === CROSSCHECK_METRICS_FLAG_WARNING});

        if(errorFlags.length > 0){
            // ERROR
            return <div className={"flag-container tooltip"}>
                <FontAwesomeIcon className="em5 mskcc-red" icon={faExclamationCircle}/>
                <span className={"tooltiptext"}>Checks failed</span>
                { flags.map((flagType) => {
                    return <p>{flagType}</p>
                }) }
            </div>
        } else if (warningFlags.length > 0){
            // WARNING
            return <div className={"flag-container tooltip"}>
                <FontAwesomeIcon className="em5 mskcc-dark-yellow" icon={faExclamationTriangle}/>
                <span className={"tooltiptext"}>Inconclusive results</span>
                { flags.map((flagType) => {
                    return <p>{flagType}</p>
                }) }
            </div>
        } else {
            // Quality Checks Passed
            return <div className={"flag-container tooltip"}>
                <FontAwesomeIcon className="em5 mskcc-dark-green" icon={faCheck}/>
                <span className={"tooltiptext"}>Passed</span>
            </div>
        }
    }
    // Waiting for results
    return <div className={"flag-container tooltip"}>
        <FontAwesomeIcon className="em5 mskcc-medium-blue" icon={faEllipsisH}/>
        <span className={"tooltiptext"}>No data</span>
    </div>
};

/**
 * Updates the state of projects in the application
 *
 * @param resp, { [PROJECT_KEY]: {...}, ... }
 */
export const updateProjects = (dispatch, stateProjects, projectUpdate) => {
    const updatedProjects = Object.assign(stateProjects || {}, projectUpdate);
    dispatch({
        type: SET_PROJECTS,
        payload: updatedProjects
    });
};
