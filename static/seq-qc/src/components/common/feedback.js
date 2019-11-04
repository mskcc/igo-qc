import React, { useEffect, useState }  from "react";
import MuiButton from "@material-ui/core/Button/Button";
import { submitFeedback } from '../../services/igo-qc-service';
import PropTypes from "prop-types";
import QcTable from "../project-page/components/qc-table";
import {MODAL_ERROR, MODAL_UPDATE} from "../../constants";

const Feedback = (props) => {
    const [feedbackType, setFeedbackType] = useState("featureRequest");
    const [feedbackBody, setFeedbackBody] = useState("");
    const [feedbackSubject, setFeedbackSubject] = useState("");

    const sendEmail = () => {
        submitFeedback(feedbackBody, feedbackSubject, feedbackType)
            .then(() => {
                props.addModalUpdate(MODAL_UPDATE, "Feedback Submitted. Thanks!", 3000);
                props.closeFeedback();
            })
            .catch((err) => {
                props.addModalUpdate(MODAL_ERROR, "Error submitting feedback. Email streidd@mskcc.org", 5000)
                props.closeFeedback();
            })
    };

    const getHelpText = () => {
          if(feedbackType === "bug"){
              return "What were you doing? What did you expect to happen? What actually happened? Please be specific"
          } else {
              return "What would you like added? Is this something that is necessary or helpful?"
          }
    };

    return <div className={"feedback-form padding-24"}>
            <p>What type of feedback?</p>
            <form className={"fill-width"}>
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
        </div>
};

export default Feedback;

QcTable.propTypes = {
    addModalUpdate: PropTypes.func,
    closeFeedback: PropTypes.boolean
};
