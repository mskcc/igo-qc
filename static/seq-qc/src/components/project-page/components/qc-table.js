import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css'
import './qc-table.css';
import Handsontable from 'handsontable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import MuiButton from '@material-ui/core/Button';

import { setRunStatus } from '../../../services/igo-qc-service';
import {MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE} from "../../../constants";

class QcTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],                       // true state of data. Contains all rows w/o filter
            displayedData: [],              // Data that has been filterd by user
            hotTableRef: React.createRef(),
            selected: [],
            statusChange: '',
            searchTerm: ''
        }
    }

    componentDidUpdate(prevProps, prevState){
        if(prevProps.data !== this.props.data){
            if(this.state.data.length > 0){
                // ONLY ADJUST MODAL - If state hasn't been set, this is the first update
                this.props.addModalUpdate(MODAL_UPDATE, `Table Updated for project ${this.props.project}`, 2000);
            };
            // Enrich data, e.g. w/ checkmark field
            const data = Object.assign([], this.props.data);
            data.map((d) => {
                d['check'] = false;
                return d;
            });
            this.setState({data, displayedData: data});
        }
    }
    afterSelection = (r1, c1, r2, c2) => {
        this.props.onSelect(this.state.displayedData[r1]);
        const [min, max] = r1 < r2 ? [r1,r2] : [r2, r1];
        const selected = this.state.displayedData.slice(min, max+1)
                                        .map((row) => {
                                            // TODO - constant
                                            return {
                                                'record': row['QC Record Id'],
                                                'sample': row['Sample']
                                            }
                                        });
        const unique_selected = selected.filter((run, idx) => selected.indexOf(run) === idx);
        this.setState({selected: unique_selected});
    };

    // REF - https://handsontable.com/blog/articles/2016/12/getting-started-with-cell-renderers
    checkRenderer(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.renderers.CheckboxRenderer.apply(this, arguments);
        if (value) {
            td.className = 'selected';
        } else {
            td.className = 'unselected'
        }
    }

    setStatusChange = (evt, data) => {
        const statusChange = evt.target.textContent || '';
        this.setState({statusChange});
    };
    // Sends request to submit status change
    submitStatusChange = () => {
        const records = this.state.selected.map((record) => record['record']);
        const samples = this.state.selected.map((record) => record['sample']).join(', ');
        const selected = records.join(',');
        const project = this.props.project;
        const statusChange = this.state.statusChange;
        const recipe = this.props.recipe;
        const successMsg = `Set Samples [${samples}] to ${statusChange}`;

        this.props.addModalUpdate(MODAL_UPDATE, `Submitting "${statusChange}" Status Change Request`, 2000);

        // Reset: Close modal
        this.setState({'selected': [], 'statusChange': ''});

        setRunStatus(selected, project, statusChange, recipe)
            .then((resp) => {
                if(resp.success){
                    this.props.addModalUpdate(MODAL_SUCCESS, `${successMsg}`);
                    // Parent component should make another call to obtain the updated projectInfo
                    this.props.updateProjectInfo(this.props.project);
                } else {
                    const status = resp.status || 'ERROR';
                    const failedRuns = resp.failedRequests || '';
                    this.props.addModalUpdate(MODAL_ERROR, `${status} ${failedRuns}`);
                }
            })
            .catch((err) => this.props.addModalUpdate(MODAL_ERROR, `Failed to set Request. Contact streidd@mskcc.org w/: ${err}`));
    };

    /**
     * Filters the state's data and assigns to displayedData
     * TODO - Test
     * @param evt
     */
    runSearch = (evt) => {
        const searchTerm = evt.target.value;
        const filteredData = this.state.data.filter((row) => {
            const values = Object.values(row);
            for(const value of values){
                if(value.toString().toLowerCase().includes(searchTerm.toLowerCase())) return true;
            }
            return false;
        });
        this.setState({searchTerm, displayedData: filteredData});
    };

    renderStatusModal() {
        if(!this.props.qcStatuses || this.state.selected.length === 0) return <div></div>
        return <div className={'pos-rel'}>
            <div className={'status-change'}>
                <FontAwesomeIcon className={"status-change-close hover"}
                                 icon={faTimes}
                                 onClick={() => this.setState({'statusChange': '', 'selected': []})}/>
                <div className={'half-width inline-block status-change-displays vertical-align-top'}>
                    <p className={'font-bold text-align-center'}>Selected Samples</p>
                    <div className={'black-border overflow-y-scroll height-inherit margin-10'}>
                        {
                            this.state.selected.map((id) => {
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
                            Object.keys(this.props.qcStatuses).map((status) => {
                                const commonClasses = 'black-border curved-border text-align-center hover';
                                const statusClass = (status === this.state.statusChange) ? 'selected-color' : 'background-white';
                                return <div key={`${status}`}
                                            className={`${commonClasses} ${statusClass}`}
                                            onClick={this.setStatusChange}>
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
                        onClick={this.submitStatusChange}
                        className={"action-button margin-10 fill-width"}
                        disabled={this.state.statusChange === ''}
                        size={"small"}>
                        <p>Submit</p>
                    </MuiButton>
                </div>
            </div>
        </div>
    }

    render() {
        // TODO - Have removable columns
        return (
            <div className={"overflow-x-scroll"}>
                {this.renderStatusModal()}
                {
                    this.state.data.length > 0 ?
                        <div className={"table-tools pos-rel"}>
                            <div className={"center-v table-search-container"}>
                                <FontAwesomeIcon className={"em5"}
                                                 icon={faSearch}/>
                                <input className={"inline vertical-align-top project-search margin-left-10"}
                                       type="text"
                                       value={this.state.searchTerm} onChange={this.runSearch} />
                            </div>
                        </div>
                    :
                        <div></div>
                }

                <HotTable
                    ref={this.hotTableRef}
                    licenseKey="non-commercial-and-evaluation"
                    id="qc-grid"
                    data={this.state.displayedData}
                    colHeaders={this.props.headers}
                    rowHeaders={true}
                    filters="true"
                    dropdownMenu={['filter_by_value', 'filter_action_bar']} // 'remove_col'
                    // allowRemoveColumn={true}
                    columnSorting={true}
                    columns={this.props.headers.map((header)=>{
                        const col = { 'data': header };
                        return col;
                    })}
                    fixedRowsTop={0}
                    fixedColumnsLeft={0}
                    // preventOverflow="horizontal"
                    selectionMode={"multiple"}
                    outsideClickDeselects={true}
                    afterSelection={this.afterSelection}
                />
            </div>
        );
    }
}

export default QcTable;

QcTable.propTypes = {
    data: PropTypes.array,
    headers: PropTypes.array,
    qcStatuses: PropTypes.object,
    onSelect: PropTypes.func,
    project: PropTypes.string,
    recipe: PropTypes.string,
    addModalUpdate: PropTypes.func,
    updateProjectInfo: PropTypes.func
};