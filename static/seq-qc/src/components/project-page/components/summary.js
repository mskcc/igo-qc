import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'

const Summary = (props) => {

    const pipelineableClass = props.requester.pipelinable === true ? 'mskcc-dark-green' : 'mskcc-dark-magenta';
    const analysisRequestedClass = props.requester.analysisRequested === true ? 'mskcc-dark-green' : 'mskcc-dark-magenta';

    return <div className={"black-border background-white"}>
        <div className={"info-block inline-block"}>
            <div className={"fill-width margin-hor-5per"}>
                <p className={"text-align-center font-bold em5"}>Project Requester</p>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Investigator</p>
                    <p className={"float-right"}>{props.requester.investigator}</p>
                </div>
                 <div className={"fill-width float-left"}>
                    <p className={"float-left"}>PI</p>
                    <p className={"float-right"}>{props.requester.pi}</p>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Pipelinable</p>
                    <FontAwesomeIcon className={`float-right em2 margin-10 ${pipelineableClass}`}
                                     icon={props.requester.pipelinable === true ? faCheck : faTimes }/>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Analysis Requested</p>
                    <FontAwesomeIcon className={`float-right em2 margin-10 ${analysisRequestedClass}`}
                                     icon={props.requester.analysisRequested === true ? faCheck : faTimes }/>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Tumor Count</p>
                    <p className={"float-right"}>{props.requester.tumorCount}</p>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Normal Count</p>
                    <p className={"float-right"}>{props.requester.normalCount}</p>
                </div>
            </div>
        </div>
        <div className={"info-block inline-block margin-hor-5per"}>
            <div className={"fill-width margin-hor-5per"}>
                <p className={"text-align-center font-bold em5"}>Project Identity</p>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Project Id</p>
                    <p className={"float-right"}>{props.requester.requestId}</p>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Cmo Project</p>
                    <p className={"float-right"}>{props.requester.cmoProject}</p>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Recipe</p>
                    <p className={"float-right"}>{props.projectType.recipe}</p>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Bait Set</p>
                    <p className={"float-right"}>{props.projectType.baitSet}</p>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Run Type</p>
                    <p className={"float-right"}>{props.requester.runType}</p>
                </div>
                <div className={"fill-width float-left"}>
                    <p className={"float-left"}>Number of Samples</p>
                    <p className={"float-right"}>{props.requester.numSamples}</p>
                </div>
            </div>
        </div>
        <div className={"info-block inline-block margin-hor-5per"}>
            <div className={"fill-width margin-hor-5per"}>
                <p className={"text-align-center font-bold em5"}>Project Status</p>
                <div>{Object.keys(props.statuses).map((status) => {
                    return <div className={"fill-width float-left"} key={status}>
                        <p className={"float-left margin-vert-5"}>{status}</p>
                        <p className={"float-right margin-vert-5"}>{props.statuses[status]}</p>
                    </div>
                })}</div>
            </div>
        </div>
    </div>
};

export default Summary;

Summary.propTypes = {
    requester: PropTypes.object,
    statuses: PropTypes.object,
    projectType: PropTypes.object
};
