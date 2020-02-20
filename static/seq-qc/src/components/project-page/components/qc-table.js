import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSave,
    faSearch,
    faAngleDown,
    faAngleRight,
    faFileExcel
} from "@fortawesome/free-solid-svg-icons";
import { BehaviorSubject } from 'rxjs';=
import config from '../../../config.js';

import 'handsontable/dist/handsontable.full.css'
import './qc-table.css';

import {saveConfig} from "../../../services/igo-qc-service";
import StatusSubmitter from './sample-status-modal';
import {downloadExcel} from "../../../utils/other-utils";
import { TABLE_MANDATORY_COLUMNS, MODAL_ERROR, MODAL_UPDATE } from "../../../resources/constants";

class QcTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],                       // true state of data. Contains all rows w/o filter
            displayedData: [],              // Data that has been filterd by user
            columns: [],                    // Mutable column order
            hotTableRef: React.createRef(),
            selected: [],
            statusChange: '',
            searchTerm: '',
            rowHeight: 25,                  // Reflects handsontable classes, ".handsontable td/th" (Default: 23px)
            showCustomizeColumns: false,
            // This needs to be updated whenever displayedData/removedColumns changes
            filteredData: [],               // filteredData will be passed as-is directly to HandsOnTable
            // For QC status change
            selectionSubject: new BehaviorSubject([]),       // Observable that can emit updates of user-selection
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        /*  Until this component depends on the selectedSample, don't update when changed. This will re-render and
            reset the grid of the table
        */
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

            /**
             * Process Columns so that they are,
             *      1) Unique
             *      2) Ordered
             *      3) Enriched with data for HandsOnTable formatting
             **/
            const data = Object.assign([], this.props.data);
            let headers = this.props.headers || [];
            const numericColumns = this.getNumericColumns(data, headers);
            // Remove duplicate columns
            const lowerCaseHeaders = headers.slice().map((header) => {return header.toLowerCase()});
            for(let i = lowerCaseHeaders.length-1; i>=0; i--){
                const val = lowerCaseHeaders[i];
                const firstIdx = lowerCaseHeaders.indexOf(val);
                if(firstIdx !== i){
                    // Remove from headers array
                    headers.splice(i,1);
                }
            }
            /**
                TODO - Some projects do not have a 'QC Record Id' column. Logic that adds visible columns to first
                'optional' column position is flawed b/c it goes by the size of TABLE_MANDATORY_COLUMNS, which includes
                'QC Record Id'
            */
            // Re-order columns according to columnOrder
            const orderedHeaders = this.props.columnOrder.slice();
            // Add all other headers to back
            for(const header of headers){
                if(this.props.columnOrder.indexOf(header) < 0){
                    orderedHeaders.push(header);
                }
            }
            // Enrich column object with metadata for column viewing
            const columns = orderedHeaders.map((col) => {
                // Create data object w/ flag, 'show', that indicates whether to show the column
                const column = {
                    data: col,
                    show: this.props.columnOrder.indexOf(col) >= 0
                };
                if(numericColumns.has(col)){
                    // Numeric Formatting: 31415 -> 31,415
                    column.type = 'numeric';
                    column.numericFormat = {pattern: '0,0'};
                }
                if(col === 'QC Status'){
                    column.renderer = (instance, td, row, col, prop, value, cellProperties) => {
                        td.innerHTML = `<div class="background-white black-border curved-border text-align-center hover"><p class="margin-1">${value}</p></div>`;
                        return td;
                    }
                }
                return column;
            });

            // Initialize data for HandsOnTable
            const filteredData = this.getFilteredData(data, columns);

            this.setState({
                filteredData,
                columns,
                data,
                displayedData: data
            });
        }
    }

    /**
     * Returns set of columns that should be formatted numerically
     *
     * @param data
     * @param columns
     * @returns {Set<*>}
     */
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

    /**
     * Filters handsOnTable based on searchTerm. Must recalculate filteredData to pass to handsOnTable
     *
     * @param evt
     */
    // TODO - Test
    runSearch = (evt) => {
        const searchTerm = evt.target.value;
        const returnedData = this.state.data.filter((row) => {
            const values = Object.values(row);
            for(const value of values){
                if(value.toString().toLowerCase().includes(searchTerm.toLowerCase())) return true;
            }
            return false;
        });

        const filteredData = this.getFilteredData(returnedData, this.state.columns);

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

    /**
     * Returns filtered list of @data objects, which have columns removed based on the @columns flag to 'show'
     *
     * @param data, List of objects w/ all data for each row entry
     * @param columns, List of objects, { data: {HEADER_VALUE}, show: boolean }
     * @returns {[]}
     */
    getFilteredData = (data, columns) => {
        const removedHeaders = columns.filter((col) => {return !col.show});
        const filtered = [];
        for(const row of data) {
            const copy = Object.assign({}, row);
            for(const column of removedHeaders){
                delete copy[column.data];
            }
            filtered.push(copy);
        }
        return filtered;
    };

    /**
     * This saves user configurations for columnOrder
     */
    saveColumnOrder = () => {
        const tableTypes = this.props.projectType.table || [];
        if(tableTypes.length === 1){
            const headerValues = this.state.columns
                .filter((col) => {return col.show})
                .map((col) => {return col.data});

            // TODO - Handle case of multiple table types/recipes
            saveConfig(tableTypes[0], headerValues).then((resp) => {
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

    renderColumnSelectors = () => {
        return this.state.columns.filter(
            // Prevent mandatory columns from being toggled-off
            (col) => { return !TABLE_MANDATORY_COLUMNS.has(col.data)}
        ).map((header) => {
            // Add css classes to show whether a column will be shown on the grid
            let classes = "inline-block header-selector";
            if(!header.show){
                classes += " btn-selected";
            }
            const headerValue = header.data || '';
            const toggle = () => {
                const newColumns = this.state.columns.slice();

                let flagged = false;
                for(let i = this.state.columns.length-1; i>=0; i--){
                    const column = newColumns[i];
                    if(column.data === headerValue) {
                        flagged = true;
                        column.show = !column.show;
                        const splicedList = newColumns.splice(i, 1);
                        if(splicedList.length !== 1){
                            console.error("Error toggling");
                            break;
                        }
                        const spliced = splicedList[0];
                        if(column.show){
                            // If column is no longer hidden, it should be the first optional column
                            const optionalStartIdx = TABLE_MANDATORY_COLUMNS.size;   // Insert directly after mandatory
                            newColumns.splice(optionalStartIdx, 0, spliced);
                        } else {
                            newColumns.splice(newColumns.length, 0, spliced);
                        }
                        break;
                    }
                }
                if(!flagged) throw Error(`Couldn't find header: ${headerValue}`);

                // Update the filteredData w/ the new removedHeaders
                const filteredData = this.getFilteredData(this.state.displayedData, newColumns);
                this.setState({columns: newColumns, filteredData});
            };
            return <div className={classes} onClick={toggle} key={`civ-${headerValue}`}>
                <p className={"inline"}>{headerValue}</p>
            </div>
        })
    };

    renderColumnCustomizer = () => {
        return <div className={"material-gray-background"}>
            <div className={"table-tools pos-rel"}>
                <div className={"height-inherit"}>
                    <div className={"table-option hover"} onClick={() => {this.setState({showCustomizeColumns: !this.state.showCustomizeColumns})}}>
                        <div className={"table-option-dropdown height-inherit pos-rel inline-block"}>
                            <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                                             icon={this.state.showCustomizeColumns ? faAngleDown : faAngleRight}/>
                        </div>
                        <p className={"inline-block vertical-align-top"}>Customize View</p>
                    </div>
                    <div className={"xlsx-container"}>
                        <div className={"xlsx-selector"}>
                            <div className={"xlsx-selector-inner"}>
                                <div className={"xlsx-type-selector black-border-right hover"} onClick={downloadExcel}>
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
                <div className={this.state.showCustomizeColumns ? "inline-block margin-bottom-15 width-95" : "display-none margin-bottom-15 width-95"}>
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
                        {this.renderColumnSelectors()}
                    </div>
                </div>
            </div>
        </div>
    };

    render() {
        /*
            Return an empty div if there is no data to render. This is REQUIRED b/c rendering the HotTable before data
            is available will cause rendering height issues as we calculate this dynamically based on window height
            and provide an overflow-y.
         */
        if(this.state.data.length === 0) return <div></div>;

        const style = { "height": `${this.calculateHeight()}`, "overflow-y": "scroll" };
        const filteredColumns = this.state.columns.filter((col) => {return col.show});
        const filteredColumnsValues = filteredColumns.map((col) => {return col.data});
        return (<div>
                    <StatusSubmitter selectionSubject={this.state.selectionSubject}
                                     statuses={this.props.qcStatuses}
                                     addModalUpdate={this.props.addModalUpdate}
                                     project={this.props.project}
                                     recipe={this.props.recipe}
                                     updateProjectInfo={this.props.updateProjectInfo}/>
                    { this.renderColumnCustomizer() }
                    <HotTable
                        ref={this.state.hotTableRef}
                        licenseKey="non-commercial-and-evaluation"
                        id="qc-grid"
                        data={this.state.filteredData}
                        colHeaders={filteredColumnsValues}
                        columns={filteredColumns}
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
