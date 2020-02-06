import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDown, faAngleRight, faQuestion } from '@fortawesome/free-solid-svg-icons'
import FingerprintingCheck from "./quality-checks-types/fingerprinting-check";

const QualityChecksSection = ({project}) => {
    const projectData = useSelector(state => state.projects[project] || {});
    const [showChecks, setShowChecks] = useState(false);
    // TODO - constants
    const entries = projectData['entries'] || [];

    return <div className={"dropdown-container"}>
        <div className={"pos-rel nav-container"} onClick={() => setShowChecks(!showChecks)}>
            <div className={"margin-left-10 inline-block"}>
                <p className={"text-align-center"}>Quality Checks</p>
            </div>
            <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                             icon={showChecks ? faAngleDown : faAngleRight}/>
        </div>
        <div className={'table-dropdown ' + `${showChecks ? "table-dropdown-open" : "table-dropdown-closed"}`}>
            <FingerprintingCheck entries={entries}/>
        </div>
    </div>
};

export default QualityChecksSection;

QualityChecksSection.propTypes = {
    project: PropTypes.string
};
