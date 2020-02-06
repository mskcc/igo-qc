import React, {useState} from 'react';
import {HotTable} from "@handsontable/react";
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";

const types = {
    NUMERIC: 'NUMERIC',
    STRING: 'STRING'
};

const HEADERS = {
    'lodScore': types.NUMERIC,
    'lodScoreTumorNormal': types.NUMERIC,
    'lodScoreNormalTumor': types.NUMERIC,
    'result': types.STRING,
    'igoIdA': types.STRING,
    'igoIdB': types.STRING
};

const FingerprintingCheck = ({entries}) => {
    const [showDescription, setShowDescription] = useState(false);

    const toggleDescription = () => {
        setShowDescription(!showDescription);
    };

    return <div>
            <FontAwesomeIcon className="hover" icon={faQuestionCircle} onClick={toggleDescription}/>
            <div className={'check-description ' + (showDescription ? 'display-inline' : 'display-none')}>
                <p>
                    <span className={"font-bold black-color"}>LOD Score</span>
                    <a href={"http://genomics.broadinstitute.org/data-sheets/POS_DetectionSampleSwapsContaminantsPedigrees_AGBT_2017.pdf"}> (Link)</a>:
                    Combined odds ratio for identity combined across set of selected SNPs
                </p>
                <p>
                    <span className={"font-bold black-color"}>LOD Score, Tumor Aware</span>
                    <a href={"https://gatk.broadinstitute.org/hc/en-us/articles/360036482352-CrosscheckFingerprints-Picard-#--CALCULATE_TUMOR_AWARE_RESULTS"}> (Link)</a>:
                    Assess identity in the presence of loss-of-heterozygosity (LOH).
                    LOH could mistakenly conclude samples from the same individual are from different individuals.
                </p>
                <p>
                    <span className={"font-bold"}>Result</span>: Result of Fingerprinting
                </p>
                <div className={"margin-left-10"}>
                    <p>
                        Expected Match: Same sample yielded LOD greater than threshold, Unexpected Match: Different sample yielded LOD greater than threshold
                    </p>
                    <p>
                        Expected Mismatch: Different sample yielded LOD less than threshold, Unexpected Mismatch: Same sample yielded LOD less than threshold
                    </p>
                    <p>
                        Inconclusive: LOD score is less than the absolute value of the threshold
                    </p>
                </div>
                <p><span className={"font-bold"}>More Information</span>: <a href={"https://github.com/broadinstitute/picard/blob/master/docs/fingerprinting/main.pdf"}>Sample Swap</a></p>
            </div>
            <div className={"hotTable-wrapper"}>
                <HotTable
                    licenseKey="non-commercial-and-evaluation"
                    id="data-check-table"
                    colHeaders={Object.keys(HEADERS)}
                    data={entries}
                    columns={Object.keys(HEADERS).map((header)=>{
                        const col = { data: header };
                        if(HEADERS[header] === types.NUMERIC){
                            col.type = 'numeric';
                            col.numericFormat = {pattern: '0,0'};
                        }
                        return col;
                    })}
                    filters="true"
                    dropdownMenu={['filter_by_value', 'filter_action_bar']}
                    columnSorting={true}
                    manualColumnMove={true}
                    style={{"height": "500px"}}
                />
            </div>
        </div>
};

export default FingerprintingCheck;

FingerprintingCheck.propTypes = {
    entries: PropTypes.array
};
