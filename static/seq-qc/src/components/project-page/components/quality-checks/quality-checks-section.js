import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faAngleDown,
    faAngleRight,
    faCheck,
    faEllipsisH,
    faExclamationCircle,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import FingerprintingCheck from "./quality-checks-types/fingerprinting-check";
import {
    CROSSCHECK_METRICS_ENTRIES,
    CROSSCHECK_METRICS_FLAG, CROSSCHECK_METRICS_FLAG_ERROR,
    CROSSCHECK_METRICS_FLAG_PASS, CROSSCHECK_METRICS_FLAG_WARNING
} from "../../../../resources/constants";

const QualityChecksSection = ({project}) => {
    const projectData = useSelector(state => state.projects[project] || {});
    const [showChecks, setShowChecks] = useState(false);

    // TODO - combine this with the util
    /**
     * Returns the correct FontAwesome icon for the input flag
     * 
     * @param flag, String
     * @returns {IconDefinition}
     */
    const getFlagIcon = (flag) => {
        if(flag === CROSSCHECK_METRICS_FLAG_PASS){
            return faCheck;
        } else if(flag === CROSSCHECK_METRICS_FLAG_WARNING){
            return faExclamationTriangle;
        } else if(flag === CROSSCHECK_METRICS_FLAG_ERROR){
            return faExclamationCircle;
        }
        return faEllipsisH;
    };

    const renderChecksContainer = (entries, project) => {
        if(entries && entries.length > 0){
            return <div className={`${showChecks ? "overflow-y-scroll table-dropdown-open" : "table-dropdown-closed"}`}>
                <FingerprintingCheck entries={entries}
                                     project={project}/>
            </div>
        }

        return <div className={"black-border"}>
            <p className={"text-align-center font-bold"}>No data available for Project {project}</p>
        </div>
    }

    return <div>
        <div className={"pos-rel nav-container"} onClick={() => setShowChecks(!showChecks)}>
            <div className={"margin-left-10 height-inherit inline-block"}>
                <div className={"width-100px height-inherit pos-rel inline-block"}>
                    <div className={"width-100px height-inherit pos-rel inline-block"}>
                        <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                                         icon={getFlagIcon(projectData[CROSSCHECK_METRICS_FLAG])}/>
                    </div>
                </div>
                <p className={"vertical-align-top text-align-center inline-block"}>Quality Checks</p>
            </div>
            <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                             icon={showChecks ? faAngleDown : faAngleRight}/>
        </div>
        {
            showChecks ? renderChecksContainer(projectData[CROSSCHECK_METRICS_ENTRIES], project) : <div></div>
        }
    </div>
};

export default QualityChecksSection;

QualityChecksSection.propTypes = {
    project: PropTypes.string
};
