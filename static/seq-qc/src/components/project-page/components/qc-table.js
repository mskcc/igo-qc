import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSave,
    faSearch,
    faAngleDown,
    faAngleRight,
    faFileExcel,
    faDna,
    faBan
} from "@fortawesome/free-solid-svg-icons";
import { BehaviorSubject } from 'rxjs';
import FileSaver from "file-saver";
import XLSX from 'xlsx';
import config from '../../../config.js';

import 'handsontable/dist/handsontable.full.css'
import './qc-table.css';

import {saveConfig} from "../../../services/igo-qc-service";
import StatusSubmitter from './sample-status-modal';
import {MODAL_ERROR, MODAL_UPDATE} from "../../../resources/constants";

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
            rowHeight: 25,                   // Reflects handsontable classes, ".handsontable td/th" (Default: 23px)
            showRemoveColumn: false,
            filteredData: [],                // This needs to be updated whenever displayedData/removedColumns changes
            // For QC status change
            selectionSubject: new BehaviorSubject([]),       // Observable that can emit updates of user-selection
            numericColumns: new Set([])                             // Tracks numeric columns to receive special formatting
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        // Until this component depends on the selectedSample, don't update when changed. This will re-render and
        // reset the grid of the table
        if(nextProps.selectedSample !== this.props.selectedSample &&
            // TODO
            // Add all additional conditions to make sure that this will still render as component is loading
            (nextProps.data === this.props.data && nextProps.headers === this.props.headers
                && nextProps.columnOrder == this.props.columnOrder)
        ) return false;
        return true;
    }

    componentDidUpdate(prevProps, prevState){
        // TODO - Neater, but slower
        const dataUpdate = prevProps.data !== this.props.data;
        const headersUpdate = (this.props.headers.length > 0 && (prevProps.columnOrder.length !== this.props.columnOrder.length));
        const columnOrderUpdate = this.props.columnOrder.length > 0 && (prevProps.headers.length !== this.props.headers.length);

        if(dataUpdate || headersUpdate || columnOrderUpdate) {
            if(this.state.data.length > 0){
                // ONLY ADJUST MODAL - If state hasn't been set, this is the first update
                this.props.addModalUpdate(MODAL_UPDATE, `Table Updated for project ${this.props.project}`, 2000);
            };

            const data = Object.assign([], this.props.data);
            const headers = this.props.headers || [];
            const numericColumns = this.getNumericColumns(data, headers);

            // Removed headers are any headers not passed in as a columnOrder property
            const removedHeaders = new Set(
                headers.filter((header) => {
                    return this.props.columnOrder.indexOf(header) < 0;
                })
            );
            // Get latest filtered data depending on the removed headers
            const filteredData = this.getFilteredData(data, removedHeaders);

            // Enrich data, e.g. w/ checkmark field
            this.setState({
                filteredData,
                removedHeaders,
                numericColumns,
                data,
                displayedData: data
            });
        }
    }

    getNumericColumns = (data, columns) => {
        if(!data || data.length === 0) return new Set([]);

        const numericColumns = new Set([]);
        const entry = data[0];  // Use the first as a representative for the data
        for(const col of columns){
            const val = entry[col];
            if(!isNaN(val)){
                numericColumns.add(col);
            }
        }

        return numericColumns;
    };

    /**
     * WARNING - Do not propogate events to parent OR modify state. Updating the state will re-render the grid
     * and lose any sorting that the user has done
     */
    afterSelection = (r1, c1, r2, c2) => {
        // PARENT COMPONENT - propogate event up
        this.props.onSelect(this.state.displayedData[r1]);

        // CHILD COMPONENT - Determine if action should be taken on the table
        // Only one column allows user to set the status
        const setStatusIdx = 0;
        if(c1 !== setStatusIdx || c2 !== setStatusIdx) {
            this.state.selectionSubject.next([]);
            return;
        };
        const [min, max] = r1 < r2 ? [r1,r2] : [r2, r1];
        const selected = [];
        for(let i = min; i<=max; i++){
            const entry = {
                'record': this.state.hotTableRef.current.hotInstance.getDataAtRowProp(i, 'QC Record Id'),
                'sample': this.state.hotTableRef.current.hotInstance.getDataAtRowProp(i, "Sample")
            };
            selected.push(entry);
        }
        const unique_selected = selected.filter((run, idx) => selected.indexOf(run) === idx);
        this.state.selectionSubject.next(unique_selected);
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

    /**
     * Filters the state's data and assigns to displayedData
     * TODO - Test
     * @param evt
     */
    runSearch = (evt) => {
        const searchTerm = evt.target.value;
        const returnedData = this.state.data.filter((row) => {
            const values = Object.values(row);
            for(const value of values){
                if(value.toString().toLowerCase().includes(searchTerm.toLowerCase())) return true;
            }
            return false;
        });

        // TODO - set filtered data
        const filteredData = this.getFilteredData(returnedData, null);

        this.setState({searchTerm, displayedData: returnedData, filteredData});
    };

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

    downloadExcel = () => {
        const xlsxData = Object.assign([], this.props.data);
        const fileName = this.props.project || 'Project';
        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const fileExtension = ".xlsx";
        const ws = XLSX.utils.json_to_sheet(xlsxData);
        const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
        const excelBuffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array"
        });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, fileName + fileExtension);
    };

    /**
     * Returns filtered data based on latest state updates to,
     *      displayedData
     *      removedHeaders
     *
     *      * Only one should be non-null as this will return the latest filtered data where only one should change
     * @returns {[]}
     */
    getFilteredData = (displayedData, removedHeaders) => {
        if(displayedData === null) {
            displayedData = this.state.displayedData;
        }
        if(removedHeaders === null){
            removedHeaders = this.state.removedHeaders;
        }
        const filtered = [];
        for(const row of displayedData) {
            const copy = Object.assign({}, row);
            for(const removed of removedHeaders){
                delete copy[removed];
            }
            filtered.push(copy);
        }
        return filtered;
    };

    /**
     * This saves user configurations for columnOrder
     */
    saveColumnOrder = () => {
        const newColumnOrder = [];
        for(const column of this.props.headers){
            if(!this.state.removedHeaders.has(column)){
                newColumnOrder.push(column);
            }
        }
        // Check for equality - Do nothing if no changes to column order
        if(newColumnOrder.length === this.props.columnOrder){
            const diff = newColumnOrder.filter((col) => {return !this.props.columnOrder.includes(col)});
            if(diff.length === 0) return;
        }
        const tableTypes = this.props.projectType.table || [];
        if(tableTypes.length === 1){
            // TODO - Handle case of multiple table types/recipes
            saveConfig(tableTypes[0], newColumnOrder).then((resp) => {
                if(!resp || resp.toLowerCase().includes('fail')){
                    this.props.addModalUpdate(MODAL_ERROR, 'Failed to update configuration', 2000);
                }
                else {
                    this.props.addModalUpdate(MODAL_UPDATE, resp, 2000);
                }
            })
        } else {
            this.props.addModalUpdate(MODAL_ERROR, `Not saving configuration for project w/ ${tableTypes.length} recipes`);
        }
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
                    <StatusSubmitter selectionSubject={this.state.selectionSubject}
                                     statuses={this.props.qcStatuses}
                                     addModalUpdate={this.props.addModalUpdate}
                                     project={this.props.project}
                                     recipe={this.props.recipe}
                                     updateProjectInfo={this.props.updateProjectInfo}/>
                    {
                        this.state.data.length > 0 ?
                            <div className={"material-gray-background"}>
                                <div className={"table-tools pos-rel"}>
                                    <div className={"height-inherit"}>
                                        <div className={"table-option hover"} onClick={() => {this.setState({showRemoveColumn: !this.state.showRemoveColumn})}}>
                                            <div className={"table-option-dropdown height-inherit pos-rel inline-block"}>
                                                <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                                                                 icon={this.state.showRemoveColumn ? faAngleDown : faAngleRight}/>
                                            </div>
                                            <p className={"inline-block vertical-align-top"}>Customize View</p>
                                        </div>
                                        <div className={"xlsx-container"}>
                                            <div className={"xlsx-selector"}>
                                                <div className={"xlsx-selector-inner"}>
                                                    <div className={"xlsx-type-selector black-border-right hover"} onClick={this.downloadExcel}>
                                                        <p className={"font-bold"}>Table Excel</p>
                                                    </div>
                                                    <a href={`${config.NGS_STATS}/ngs-stats/get-picard-project-excel/${this.props.project}`}>
                                                        <div className={"xlsx-type-selector hover"}>
                                                            <p className={"font-bold"}>Picard Excel</p>
                                                        </div>
                                                    </a>
                                                </div>
                                            </div>
                                            <FontAwesomeIcon className={"font-size-24 center-hv hover"}
                                                             icon={faFileExcel}/>
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
                                    <div className={this.state.showRemoveColumn ? "inline-block margin-bottom-15 width-95" : "display-none margin-bottom-15 width-95"}>
                                        <div>
                                            <div className={"margin-bottom-15"}>
                                                <p className={"inline-block"}>Columns in View</p>
                                                <div className={"tooltip"}>
                                                    <FontAwesomeIcon className={"em5 hover inline-block margin-left-10"}
                                                                     icon={faSave}
                                                                     onClick={this.saveColumnOrder}/>
                                                    <span className={"tooltiptext"}>Save View</span>
                                                </div>
                                            </div>
                                            {headersToRemove.map((header) => {
                                                let classes = "inline-block header-selector";
                                                if(this.state.removedHeaders.has(header)) { classes += " btn-selected"; }
                                                const toggle = () => {
                                                    // TODO - Add endpoint to igoLims to see what columns get removed
                                                    const removedHeaders = this.state.removedHeaders;
                                                    if(removedHeaders.has(header)) {
                                                        removedHeaders.delete(header);
                                                    }
                                                    else{
                                                        removedHeaders.add(header);
                                                    }

                                                    // Update the filteredData w/ the new removedHeaders
                                                    const filteredData = this.getFilteredData(null, removedHeaders);
                                                    this.setState({removedHeaders, filteredData});
                                                };
                                                return <div className={classes} onClick={toggle} key={`civ-${header}`}>
                                                    <p className={"inline"}>{header}</p>
                                                </div>
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        :
                            <div></div>
                    }
                    <HotTable
                        ref={this.state.hotTableRef}
                        licenseKey="non-commercial-and-evaluation"
                        id="qc-grid"
                        data={this.state.filteredData}
                        colHeaders={colHeaders}
                        columns={colHeaders.map((data)=>{
                            const col = { data };
                            if(this.state.numericColumns.has(data)){
                                // Numeric Formatting: 31415 -> 31,415
                                col.type = 'numeric';
                                col.numericFormat = {pattern: '0,0'};
                            }
                            if(data === 'QC Status'){
                                col.renderer = (instance, td, row, col, prop, value, cellProperties) => {
                                    td.innerHTML = `<div class="background-white black-border curved-border text-align-center hover"><p class="margin-1">${value}</p></div>`;
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
    onSelect: PropTypes.func,               // Propogates selectedSample to parent
    selectedSample: PropTypes.string,       // Only passed so that the component won't re-render when updated
    project: PropTypes.string,
    recipe: PropTypes.string,
    addModalUpdate: PropTypes.func,
    updateProjectInfo: PropTypes.func,
    columnOrder: PropTypes.array,
    projectType: PropTypes.object
};
