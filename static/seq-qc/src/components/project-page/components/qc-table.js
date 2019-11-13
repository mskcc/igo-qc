import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css'
import './qc-table.css';
import Handsontable from 'handsontable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTimes, faSearch, faArrowAltCircleRight, faAngleDown, faAngleRight} from "@fortawesome/free-solid-svg-icons";
import MuiButton from '@material-ui/core/Button';
import MuiDownshift from 'mui-downshift'

import { setRunStatus } from '../../../services/igo-qc-service';
import {MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE} from "../../../constants";

class QcTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],                       // true state of data. Contains all rows w/o filter
            displayedData: [],              // Data that has been filterd by user
            removedHeaders: new Set([]),
            hotTableRef: React.createRef(),
            selected: [],
            statusChange: '',
            searchTerm: '',
            rowHeight: 23,                   // This shouldn't change. It is the height of each row in the HotTable
            showRemoveColumn: false
        };
    }

    componentDidUpdate(prevProps, prevState){
        if(prevProps.data !== this.props.data){
            if(this.state.data.length > 0){
                // ONLY ADJUST MODAL - If state hasn't been set, this is the first update
                this.props.addModalUpdate(MODAL_UPDATE, `Table Updated for project ${this.props.project}`, 2000);
            };
            // Enrich data, e.g. w/ checkmark field
            this.setState({
                data: Object.assign([], this.props.data),
                displayedData: Object.assign([], this.props.data)
            });
        }
        if((this.props.headers.length > 0 && (prevProps.columnOrder.length !== this.props.columnOrder.length)) ||
            this.props.columnOrder.length > 0 && (prevProps.headers.length !== this.props.headers.length)) {
            const removedColumns = this.props.headers.filter((header) => {
                return this.props.columnOrder.indexOf(header) < 0;
            });
            this.setState({removedHeaders: new Set(removedColumns)});
        }
    }
    afterSelection = (r1, c1, r2, c2) => {
        // PARENT COMPONENT - propogate event up
        this.props.onSelect(this.state.displayedData[r1]);

        // CHILD COMPONENT - Determine if action should be taken on the table
        // Only one column allows user to set the status
        const setStatusIdx = 0;
        if(c1 !== setStatusIdx || c2 !== setStatusIdx) {
            this.setState({selected: []});
            return;
        };
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
            .catch((err) => this.props.addModalUpdate(MODAL_ERROR, `Failed to set Request. Please submit a bug report using the "Feedback" button in the top-right corner w/: ${err}`));
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

    /**
     * We calculate the height because implementing HotTable w/ overflow can create excess height when there are many
     * rows (REF: https://github.com/handsontable/handsontable/issues/4141#issuecomment-360429985)
     *      We calculate the height as a product of the state's rowHeight & displayedData length
     *
     * @returns {string}, "100vh" or "{HEIGHT}px"
     */
    calculateHeight = () => {
        // REF - https://stackoverflow.com/a/28241682/3874247
        const availableHeight = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;
        const neededHeight = this.state.displayedData.length * this.state.rowHeight;

        // If we are already exceeding the window height, just return the full viewport height
        if(neededHeight > availableHeight) return '80vh';

        const headerSize = 45;
        return `${neededHeight + headerSize}px`;
    };

    getHeaders = () => {
        const headers = [];

        // Columns specified by columnOrder props should come first
        for(const header of this.props.columnOrder){
            if(!this.state.removedHeaders.has(header)) {
                headers.push(header);
            }
        }

        // Append differences between all headers & column order that have not been removed
        let difference = this.props.headers.filter((header) => !this.props.columnOrder.includes(header));
        for(const header of difference){
            if(!this.state.removedHeaders.has(header)) {
                headers.push(header);
            }
        }

        return headers;
    };

    getFilteredData = () => {
        const filtered = [];
        for(const row of this.state.displayedData) {
            const copy = Object.assign({}, row);
            for(const removed of this.state.removedHeaders){
                delete copy[removed];
            }
            filtered.push(copy);
        }
        return filtered;
    };

    render() {
        /*
            Return an empty div if there is no data to render. This is REQUIRED b/c rendering the HotTable before data
            is available will cause rendering height issues as we calculate this dynamically based on window height
            and provide an overflow-y.
         */
        if(this.state.data.length === 0) return <div></div>;

        const style = { "height": `${this.calculateHeight()}`, "overflow-y": "scroll" };

        const colHeaders = this.getHeaders();
        const mandatoryColumns = new Set(['Sample', 'QC Record Id']);
        const headersToRemove = [];
        if(this.state.showRemoveColumn){
            for(const header of this.props.headers){
                if(!mandatoryColumns.has(header)){
                    headersToRemove.push(header);
                }
            }
        }
        return (<div>
                    {this.renderStatusModal()}
                    {
                        this.state.data.length > 0 ?
                            <div className={"material-gray-background"}>
                                <div className={"table-tools pos-rel"}>
                                    <div className={"height-inherit"}>
                                        <div className={"table-option hover"} onClick={() => {
                                            this.setState({showRemoveColumn: !this.state.showRemoveColumn})}}>
                                            <div className={"table-option-dropdown height-inherit pos-rel inline-block"}>
                                                <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                                                                 icon={this.state.showRemoveColumn ? faAngleDown : faAngleRight}/>
                                            </div>
                                            <p className={"inline-block vertical-align-top"}>Customize View</p>
                                        </div>
                                    </div>
                                    <div className={"center-v table-search-container"}>
                                        <FontAwesomeIcon className={"em5"}
                                                         icon={faSearch}/>
                                        <input className={"inline vertical-align-top project-search margin-left-10"}
                                               type="text"
                                               value={this.state.searchTerm} onChange={this.runSearch} />
                                    </div>
                                </div>
                                <div className={"header-removal-selector fill-width"}>
                                    <div className={this.state.showRemoveColumn ? "inline-block margin-bottom-15 fill-width" : "display-none margin-bottom-15 fill-width"}>
                                        <p>Columns in View</p>
                                        {headersToRemove.map((header) => {
                                            let classes = "inline-block header-selector";
                                            if(this.state.removedHeaders.has(header)) { classes += " btn-selected"; }
                                            const toggle = () => {
                                                // TODO - Add endpoint to igoLims to see what columns get removed
                                                const removedHeaders = this.state.removedHeaders;
                                                if(removedHeaders.has(header)) removedHeaders.delete(header);
                                                else removedHeaders.add(header);
                                                this.setState({removedHeaders});
                                            };
                                            return <div className={classes} onClick={toggle} key={`civ-${header}`}>
                                                <p className={"inline"}>{header}</p>
                                            </div>
                                        })}
                                    </div>
                                </div>
                            </div>
                        :
                            <div></div>
                    }
                    <HotTable
                        ref={this.hotTableRef}
                        licenseKey="non-commercial-and-evaluation"
                        id="qc-grid"
                        data={this.getFilteredData()}
                        colHeaders={colHeaders}
                        columns={colHeaders.map((data)=>{
                            const col = {data};
                            if(data === 'QC Status'){
                                col.renderer = (instance, td, row, col, prop, value, cellProperties) => {
                                    td.innerHTML = `<div class="black-border curved-border text-align-center hover">${value}</div>`;
                                    return td;
                                }
                            }
                            else {
                                col.renderer = (instance, td, row, col, prop, value, cellProperties) => {
                                    td.innerHTML = `<div class="text-align-center">${value}</div>`;
                                    if(row % 2 === 0) td.style.backgroundColor = '#eceff1';
                                    return td;
                                }
                            }
                            return col;
                        })}
                        rowHeaders={true}
                        filters="true"
                        dropdownMenu={['filter_by_value', 'filter_action_bar']}
                        columnSorting={true}
                        manualColumnMove={true}
                        fixedRowsTop={0}
                        fixedColumnsLeft={0}
                        preventOverflow="horizontal"
                        selectionMode={"multiple"}
                        outsideClickDeselects={true}
                        afterSelection={this.afterSelection}
                        rowHeights={`${this.state.rowHeight}px`}
                        style={style}
                    />
                </div>);
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
    updateProjectInfo: PropTypes.func,
    columnOrder: PropTypes.array
};