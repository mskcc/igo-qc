import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTimes, faSearch, faAngleDown, faAngleRight, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import MuiButton from '@material-ui/core/Button';
import { BehaviorSubject } from 'rxjs';
import FileSaver from "file-saver";
import XLSX from 'xlsx';

import 'handsontable/dist/handsontable.full.css'
import './qc-table.css';

import StatusSubmitter from './sample-status-modal';
import {MODAL_UPDATE} from "../../../resources/constants";

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
            showRemoveColumn: false,
            filteredData: [],                // This needs to be updated whenever displayedData/removedColumns changes
            // For QC status change
            selectionSubject: new BehaviorSubject([])      // Observable that can emit updates of user-selection
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
                data,
                displayedData: data
            });
        }
    }

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
        const selected = this.state.displayedData.slice(min, max+1)
                                        .map((row) => {
                                            // TODO - constant
                                            return {
                                                'record': row['QC Record Id'],
                                                'sample': row['Sample']
                                            }
                                        });
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
                                        <div className={"table-option hover"} onClick={() => {
                                            this.setState({showRemoveColumn: !this.state.showRemoveColumn})}}>
                                            <div className={"table-option-dropdown height-inherit pos-rel inline-block"}>
                                                <FontAwesomeIcon className={"dropdown-nav center-v inline-block"}
                                                                 icon={this.state.showRemoveColumn ? faAngleDown : faAngleRight}/>
                                            </div>
                                            <p className={"inline-block vertical-align-top"}>Customize View</p>
                                        </div>
                                        <div className={"xlsx-container"}>
                                            <FontAwesomeIcon className={"font-size-24 hover center-hv"}
                                                             icon={faFileExcel}
                                                             onClick={this.downloadExcel}/>
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
                                        <p>Columns in View</p>
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
                        :
                            <div></div>
                    }
                    <HotTable
                        ref={this.hotTableRef}
                        licenseKey="non-commercial-and-evaluation"
                        id="qc-grid"
                        data={this.state.filteredData}
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
    onSelect: PropTypes.func,               // Propogates selectedSample to parent
    selectedSample: PropTypes.string,       // Only passed so that the component won't re-render when updated
    project: PropTypes.string,
    recipe: PropTypes.string,
    addModalUpdate: PropTypes.func,
    updateProjectInfo: PropTypes.func,
    columnOrder: PropTypes.array,
};
