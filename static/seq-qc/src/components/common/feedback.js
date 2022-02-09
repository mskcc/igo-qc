import React, { useEffect, useState }  from "react";
import MuiButton from "@material-ui/core/Button/Button";
import { submitFeedback } from '../../services/igo-qc-service';
import PropTypes from "prop-types";
import QcTable from "../project-page/components/qc-table";
import {MODAL_ERROR, MODAL_UPDATE} from "../../resources/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import { getFeedback } from '../../services/igo-qc-service';

const WORKING = '0';
const DONE = '1';

const Feedback = (props) => {
    const [feedbackType, setFeedbackType] = useState("featureRequest");
    const [feedbackBody, setFeedbackBody] = useState("");
    const [feedbackSubject, setFeedbackSubject] = useState("");
    const [currentFeedback, setCurrentFeedback] = useState("");
    const [showForm, setShowForm] = useState(true);

    useEffect(() => {
        sendFeedbackRequest();
    }, []);

    const sendFeedbackRequest = () => {
        getFeedback()
            .then((resp) => {
                setCurrentFeedback(resp['feedback'] || {});
            })
    };

    const sendEmail = () => {
        submitFeedback(feedbackBody, feedbackSubject, feedbackType)
            .then(() => {
                props.addModalUpdate(MODAL_UPDATE, "Feedback Submitted. Thanks!", 3000);
                props.closeFeedback();
            })
            .catch((err) => {
                props.addModalUpdate(MODAL_ERROR, "Error submitting feedback. Email skigodata@mskcc.org", 5000)
                props.closeFeedback();
            })
    };

    const getHelpText = () => {
          if(feedbackType === "bug"){
              return "What happened? What did you expect to happen? Please be specific"
          } else {
              return "What would you like added? Is this something that is necessary or helpful?"
          }
    };

    const showFeedbackView = () => {
        return <table className={"fill-width border-collapse"}>
                <thead>
                    <tr className={"black-border"}>
                        <th className={"width-15 text-align-center black-border-right"}>Type</th>
                        <th className={"width-85 text-align-center"}>Subject</th>
                    </tr>
                </thead>
                <tbody>
                    {[WORKING, DONE].map((type) => {
                        return showFeedbackType(currentFeedback, type)
                    })}
                </tbody>
            </table>;
    };

    const showFeedbackType = (feedback, status) => {
        const feedbackList = feedback[status] || [];

        const feedbackDivs = [];
        for(let i = 0; i< feedbackList.length; i+=1 ){
            const entry = feedbackList[i];
            const type = entry[0] === "bug" ? "Bug" : "Feature";
            const txt = entry[1];

            const rowColor = (status === DONE) ? 'mskcc-dark-gray-background' : 'material-gray-background';
            const rowStyle = `black-border fill-width ${rowColor}`;
            const element = <tr className={rowStyle} key={`${status}-${type}-${i}`}>
                <td className={"text-align-center black-border-right"}>
                    <p className="font-size-12">{type}</p>
                </td>
                <td className={"text-align-center"}>
                    <p className="font-size-12">{txt}</p>
                </td>
            </tr>;
            feedbackDivs.push(element);
        }
        return feedbackDivs;
    };

    const showFormView = () => {
        return <form className={"fill-width"}>
            <p className={"text-align-center font-bold"}>What type of feedback?</p>
            <div className={"margin-left-10"}>
                <label>
                    <input className={"inline-block"}
                           type="radio"
                           value="featureRequest"
                           onChange={() => setFeedbackType("featureRequest")}
                           checked={feedbackType === "featureRequest"} />
                    <p className={"inline"}>Feature Request</p>
                </label>
                <label className={"margin-left-10"}>
                    <input className={"inline-block"}
                           type="radio"
                           value="bug"
                           onChange={() => setFeedbackType("bug")}
                           checked={feedbackType === "bug"} />
                    <p className={"inline"}>Bug</p>
                </label>
            </div>
            <label className={"inline-block fill-width margin-top-15"}>
                <div className={"block fill-width"}>
                    <p className={"inline"}>Subject</p>
                    <input className={"inline margin-left-10"}
                           type="text"
                           value={feedbackSubject}
                           onChange={(evt) => setFeedbackSubject(evt.target.value)} />
                </div>
            </label>
            <div>
                <p className={"margin-left-10 italics mskcc-dark-gray"}>{getHelpText()}</p>
            </div>
            <label className={"inline-block fill-width margin-top-15"}>
                <textarea className={"feedback-text"}
                          type="textarea"
                          value={feedbackBody}
                          onChange={(evt) => setFeedbackBody(evt.target.value)} />
            </label>
            <MuiButton
                variant="contained"
                onClick={sendEmail}
                className={"feedback-submit-btn"}
                disabled={feedbackBody === "" || feedbackSubject === ""}
                size={"small"}>
                <p className={"margin-0"}>Send</p>
            </MuiButton>
        </form>
    };

    return <div className={"feedback-form padding-24"}>
            <FontAwesomeIcon className={"status-change-close hover"}
                         icon={faTimes}
                         onClick={() => props.closeFeedback()}/>
            <div className={"feedback-container"}>
                { showForm ? showFormView() : showFeedbackView()}
            </div>
            <div className={"fill-width black-border"}>
                <div className={'half-width inline-block text-align-center hover' + (showForm ? ' selected-color' : '')}
                     onClick={() => setShowForm(true)}>
                    <p>Submit</p>
                </div>
                <div className={'half-width inline-block text-align-center hover' + (!showForm ? ' selected-color' : '')}
                     onClick={() => setShowForm(false)}>
                    <p>Check Status</p>
                </div>
            </div>
        </div>
};

export default Feedback;

Feedback.propTypes = {
    addModalUpdate: PropTypes.func,
    closeFeedback: PropTypes.bool
};
