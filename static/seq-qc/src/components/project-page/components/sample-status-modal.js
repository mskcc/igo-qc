import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import {faTimes} from "@fortawesome/free-solid-svg-icons";
import MuiButton from "@material-ui/core/Button/Button";
import {MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE} from "../../../resources/constants";
import {setRunStatus} from "../../../services/igo-qc-service";

/**
 * Modal that is rendered when an update from the parent observable is sent
 *
 * @param props
 * @returns {*}
 * @constructor
 */
const StatusSubmitter = (props) => {
    const [statusChange, setStatusChange] = useState('');   // Status that will be set for selected
    const [selected, setSelected] = useState([]);           // [ { 'record': '', 'sample': '' }, ...  ]

    // Subscribe to parent's updater for when user selects a sample. Should only happen once
    useEffect(() => {
        props.selectionSubject.subscribe((update) => {
            if(update.length !== selected.length || update.length === 0) {
                setSelected(update);
            }
        })
    }, []);

    /**
     * Sets status change based on user selection
     * @param evt
     */
    const handleStatusChange = (evt, data) => {
        const statusChange = evt.target.textContent || '';
        setStatusChange(statusChange);
    };

    /**
     * Sends request to submit status change
     */
    const submitStatusChange = () => {
        const records = selected.map((record) => record['record']);
        const samples = selected.map((record) => record['sample']).join(', ');
        const selectedString = records.join(',');
        const project = props.project;
        const recipe = props.recipe;
        const successMsg = `Set Samples [${samples}] to ${statusChange}`;

        props.addModalUpdate(MODAL_UPDATE, `Submitting "${statusChange}" Status Change Request`, 2000);

        setStatusChange('');
        setSelected([]);
        setRunStatus(selectedString, project, statusChange, recipe)
            .then((resp) => {
                if(resp.success){
                    props.addModalUpdate(MODAL_SUCCESS, `${successMsg}`);
                    // Parent component should make another call to obtain the updated projectInfo
                    props.updateProjectInfo(props.project);
                } else {
                    const status = resp.status || 'ERROR';
                    const failedRuns = resp.failedRequests || '';
                    props.addModalUpdate(MODAL_ERROR, `${status} ${failedRuns}`);
                }
            })
            .catch((err) => props.addModalUpdate(MODAL_ERROR, `Failed to set Request. Please submit a bug report using the "Feedback" button in the top-right corner w/: ${err}`));
    };

    /**
     * Clear selection. This function should trigger an empty div. TODO: test
     */
    const clearSelection = () => {
        setSelected([]);
        setStatusChange('');
    };

    // Don't render if nothing is selected or statuses are not available
    if(!props.statuses || selected.length === 0) {
        return <div></div>
    }
    return <div className={'pos-rel'}>
        <div className={'status-change'}>
            <FontAwesomeIcon className={"status-change-close hover"}
                             icon={faTimes}
                             onClick={clearSelection}/>
            <div className={'half-width inline-block status-change-displays vertical-align-top'}>
                <p className={'font-bold text-align-center'}>Selected Samples</p>
                <div className={'black-border overflow-y-scroll height-inherit margin-10'}>
                    {
                        selected.map((id) => {
                            return <div className={"background-white text-align-center black-border-bottom"} key={`${id['sample']}-sample`}>
                                <p className={"padding-for-margin"}>{id['sample']}</p>
                            </div>
                        })
                    }
                </div>
            </div>
            <div className={'half-width inline-block vertical-align-top'}>
                <p className={'font-bold text-align-center'}>New Status</p>
                <div className={'status-change-displays margin-10'}>
                    {
                        Object.keys(props.statuses).map((status) => {
                            const commonClasses = 'black-border curved-border text-align-center hover';
                            const statusClass = (status === statusChange) ? 'selected-color' : 'background-white';
                            return <div key={`${status}`}
                                        className={`${commonClasses} ${statusClass}`}
                                        onClick={handleStatusChange}>
                                <p className={"padding-for-margin"}>{status}</p>
                            </div>
                        })
                    }
                </div>
            </div>
            <div className={'margin-auto half-width'}>
                <MuiButton
                    variant="contained"
                    type="submit"
                    onClick={submitStatusChange}
                    className={"action-button margin-10 fill-width"}
                    disabled={statusChange === ''}
                    size={"small"}>
                    <p>Submit</p>
                </MuiButton>
            </div>
        </div>
    </div>;
};

export default StatusSubmitter;

StatusSubmitter.propTypes = {
    selectionSubject: PropTypes.object,     // Observable that propogates selection updates to component
    statuses: PropTypes.object              // Available statuses for submission
};
