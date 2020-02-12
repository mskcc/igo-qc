import React, {useState, useEffect} from 'react';
import {HotTable} from "@handsontable/react";
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFileExcel, faQuestionCircle} from "@fortawesome/free-solid-svg-icons";
import {downloadExcel} from "../../../../../utils/other-utils";

const types = {
    NUMERIC: 'NUMERIC',
    STRING: 'STRING'
};

const HEADERS = {
    'result': types.STRING,
    'lodScore': types.NUMERIC,
    'lodScoreTumorNormal': types.NUMERIC,
    'lodScoreNormalTumor': types.NUMERIC,
    'igoIdA': types.STRING,
    'igoIdB': types.STRING,
    "tumorNormalA": types.STRING,
    "tumorNormalB": types.STRING,
    "patientIdA": types.STRING,
    "patientIdB": types.STRING
};

const FingerprintingCheck = ({entries, project}) => {
    const [showDescription, setShowDescription] = useState(false);

    /**
     * Removing same-igoId comparisions and duplicate pairs from the data to be displayed to the user
     *
     *      Input   1:1, 1:3, 2:1, 1:2, 2:3, 3:1, 2:2, 3:3, 3:2
     *                   1:3, 2:1, 1:2, 2:3, 3:1,           3:2     (Same-Sample Filter)
     *      Output  1:2, 1:3, 2:3
     *
     * @param entryList, Object[]
     * @returns {[]}
     */
    const filtereDuplicatePairs = (entryList) => {
        const orderedEntries = entryList
            // Remove any same-sample lines
            .filter((entry) => {
                return entry['igoIdA'] !== entry['igoIdB']
            })
            // Order alphabetically by igoIdA & igoIdB
            .sort((e1, e2) => {
                const id1 = e1['igoIdA'].toUpperCase() + e1['igoIdB'].toUpperCase();
                const id2 = e2['igoIdA'].toUpperCase() + e2['igoIdB'].toUpperCase();

                return (id1 < id2) ? -1 : (id1 > id2) ? 1 : 0;
            });

        const filteredEntries = [];
        const pairs = new Set();
        for(let entry of orderedEntries){
            // Get unique key for every pair (must sort)
            const key = [entry['igoIdA'], entry['igoIdB']].sort().join(',');
            if(!pairs.has(key)){
                pairs.add(key);
                filteredEntries.push(entry);
            }
        }
        return filteredEntries;
    };
    // Remove duplicate pairs
    const [filteredEntries, setFilteredEntries] = useState(filtereDuplicatePairs(entries));
    const toggleDescription = () => {
        setShowDescription(!showDescription);
    };

    return <div className={"fingerprint-check-wrapper"}>
            <div className={"text-align-center"}>
                <h1 className={"inline-block"}>Fingerprinting</h1>
                <FontAwesomeIcon className="hover block inline-block margin-bottom-15" icon={faQuestionCircle} onClick={toggleDescription}/>
                <FontAwesomeIcon className={"font-size-24 margin-left-25 hover"}
                                 onClick={() => {downloadExcel(entries, `${project}_fingerprinting`)}}
                                 icon={faFileExcel}/>
            </div>
            <div className={"check-description"}>
                <div className={showDescription ? 'inline-block' : 'display-none'}>
                    <p>
                        <span className={"font-bold black-color"}>LOD Score</span>
                        <a href={"http://genomics.broadinstitute.org/data-sheets/POS_DetectionSampleSwapsContaminantsPedigrees_AGBT_2017.pdf"}> (Link)</a>:
                        Numerical result for determining identity created from the logarithm of odds scores combined across a set of selected SNPs.
                        Higher scores indicate greater likelihood of being from the same subject
                    </p>
                    <p>
                        <span className={"font-bold black-color "}>LOD Score, Tumor Aware</span>
                        <a href={"https://gatk.broadinstitute.org/hc/en-us/articles/360036482352-CrosscheckFingerprints-Picard-#--CALCULATE_TUMOR_AWARE_RESULTS"}> (Link)</a>:
                        Assesses identity in the presence of loss-of-heterozygosity (LOH)
                    </p>
                    <p>
                        <span className={"font-bold"}>Result</span>: Result of Fingerprinting
                    </p>
                    <div className={"margin-left-10"}>
                        <p>
                            <span className={"underline"}>Expected Match</span>: Same sample yielded LOD greater than threshold, <span className={"underline"}>Unexpected Match</span>: Different sample yielded LOD greater than threshold
                        </p>
                        <p>
                            <span className={"underline"}>Expected Mismatch</span>: Different sample yielded LOD less than threshold, <span className={"underline"}>Unexpected Mismatch</span>: Same sample yielded LOD less than threshold
                        </p>
                        <p>
                            <span className={"underline"}>Inconclusive</span>: LOD score is less than the absolute value of the threshold
                        </p>
                    </div>
                    <p><span className={"font-bold"}>More Information</span>: <a href={"https://github.com/broadinstitute/picard/blob/master/docs/fingerprinting/main.pdf"}>Sample Swap</a></p>
                </div>
            </div>
            <HotTable
                licenseKey="non-commercial-and-evaluation"
                id="data-check-table"
                colHeaders={Object.keys(HEADERS)}
                data={filteredEntries}
                columns={Object.keys(HEADERS).map((header)=>{
                    const col = { data: header };
                    if(HEADERS[header] === types.NUMERIC){
                        col.type = 'numeric';
                        col.numericFormat = {pattern: '0,0'};
                    }
                    return col;
                })}
                rowHeaders={true}
                filters="true"
                dropdownMenu={['filter_by_value', 'filter_action_bar']}
                columnSorting={true}
                manualColumnMove={true}
                preventOverflow="horizontal"
                style={{"border": "black 1px solid"}}
            />
        </div>
};

export default FingerprintingCheck;

FingerprintingCheck.propTypes = {
    entries: PropTypes.array,
    project: PropTypes.string
};
