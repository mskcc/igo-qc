import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown, faAngleRight, faQuestion } from '@fortawesome/free-solid-svg-icons'
import FingerprintingCheck from "./quality-checks-types/fingerprinting-check";
import {CROSSCHECK_METRICS_ENTRIES} from "../../../../resources/constants";

const QualityChecksSection = ({project}) => {
    const projectData = useSelector(state => state.projects[project] || {});
    const [showChecks, setShowChecks] = useState(false);

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
            <div className={"margin-left-10 inline-block"}>
                <p className={"text-align-center"}>Quality Checks</p>
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
