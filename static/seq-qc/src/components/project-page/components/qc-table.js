import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css'
import './qc-table.css';
import Handsontable from 'handsontable';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import MuiButton from '@material-ui/core/Button';

import { setRunStatus } from '../services/igo-qc-service';
import {MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE} from "../../../constants";

class QcTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            hotTableRef: React.createRef(),
            selected: [],
            statusChange: ''
        }
    }

    componentDidUpdate(prevProps, prevState){
        if(this.props.data.length > 0 && this.state.data.length === 0){
            // Enrich data, e.g. w/ checkmark field
            const data = Object.assign([], this.props.data);
            data.map((d) => {
                d['check'] = false;
                return d;
            });
            this.setState({data});
        }
    }
    afterSelection = (r1, c1, r2, c2) => {
        this.props.onSelect(this.state.data[r1]);

        const [min, max] = r1 < r2 ? [r1,r2] : [r2, r1];
        const selected = this.state.data.slice(min, max+1)
                                        .map((row) => row['Run'])
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
        const selected = this.state.selected.join(',');
        const project = this.props.project;
        const statusChange = this.state.statusChange;
        const recipe = this.props.recipe;
        const successMsg = `Set Runs ${selected} to ${statusChange}`;

        this.props.addModalUpdate(MODAL_UPDATE, `Submitting Status Change Request`);

        // Reset: Close modal
        this.setState({'selected': []});

        setRunStatus(selected, project, statusChange, recipe)
            .then((resp) => this.props.addModalUpdate(MODAL_SUCCESS, `${successMsg}`))
            .catch((err) => this.props.addModalUpdate(MODAL_ERROR, `Failed to set Request. Contact streidd@mskcc.org w/: ${err}`));
    };

    renderStatusModal() {
        if(!this.props.qcStatuses || this.state.selected.length === 0) return <div></div>
        return <div className={'pos-rel'}>
            <div className={'status-change'}>
                <FontAwesomeIcon className={"status-change-close hover"}
                                 icon={faTimes}
                                 onClick={() => this.setState({'selected': []})}/>
                <div className={'half-width inline-block status-change-displays vertical-align-top'}>
                    <div className={'margin-10'}>
                        <p className={'font-bold text-align-center'}>Selected Runs</p>
                        {
                            this.state.selected.map((id) => {
                                return <div className={"text-align-center black-border-bottom"} key={`${id}-sample`}>
                                    <p className={"margin-5em"}>{id}</p>
                                </div>
                            })
                        }
                    </div>
                </div>
                <div className={'half-width inline-block status-change-displays vertical-align-top'}>
                    <div className={'margin-10'}>
                        <label className={'font-bold text-align-center'}>New Status</label>
                        {
                            Object.keys(this.props.qcStatuses).map((status) => {
                                const commonClasses = 'black-border curved-border text-align-center hover';
                                const statusClass = (status === this.state.statusChange) ? 'selected-color' : 'unselected-color';
                                return <div key={`${status}`}
                                            className={`${commonClasses} ${statusClass}`}
                                            onClick={this.setStatusChange}>
                                    <p className={"margin-5em"}>{status}</p>
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
                        className={"margin-10 fill-width"}
                        disabled={this.state.statusChange === ''}
                        size={"small"}>
                        <p>Submit</p>
                    </MuiButton>
                </div>
            </div>
        </div>
    }

    render() {
        // TODO - this was done to prevent any rendering of hot-table. Needed?
        // if(this.props.data.length === 0 || this.props.headers.length === 0) return <div></div>
        /*
        const data = this.props.data.map((d) => {
            d['QC Status'] = '<div><button>TEST</button></div>';
            return d;
        });
         */
        /*
        debugger;
        const data = this.props.data.map((d) => {
            d['check'] = false;
            return d;
        });
        */

        // const headers = this.props.headers;

        // TODO - put in state
        /*
        const headers = Object.assign([], this.props.headers);
        headers.unshift('check');
        */

        return (
            <div>
                {this.renderStatusModal()}
                <HotTable
                    ref={this.hotTableRef}
                    licenseKey="non-commercial-and-evaluation"
                    id="qc-grid"
                    data={this.state.data}
                    colHeaders={this.props.headers}
                    rowHeaders={true}
                    filters="true"
                    dropdownMenu={['filter_by_value', 'filter_action_bar', 'remove_col']}
                    columnSorting="true"
                    columns={this.props.headers.map((header)=>{
                        const col = { 'data': header };
                        /*
                        if(header === 'check'){
                            col['renderer'] = this.checkRenderer;
                        }
                         */
                        return col;
                    })}
                    fixedRowsTop={0}
                    fixedColumnsLeft={0}
                    preventOverflow="horizontal"
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
    addModalUpdate: PropTypes.func
};