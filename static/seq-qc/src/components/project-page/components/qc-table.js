import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css'
import './qc-table.css';
import Handsontable from 'handsontable';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";

class QcTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            hotTableRef: React.createRef(),
            selected: []
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

        const min = r1 < r2 ? r1 : r2;
        const max = r1 < r2 ? r2 : r1;

        const selected = this.state.data.slice(min, max+1).map((row) => row['IGO Id']);
        this.setState({selected});
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

    renderStatusModal() {
        if(!this.props.qcStatuses || this.state.selected.length === 0) return <div></div>
        return <div className={'pos-rel'}>
            <div className={'status-change'}>
                <FontAwesomeIcon className={"status-change-close hover"}
                                 icon={faTimes}
                                 onClick={() => this.setState({'selected': []})}/>
                <div className={'half-width inline-block status-change-displays vertical-align-top'}>
                    <div className={'margin-10'}>
                        <p className={'font-bold text-align-center'}>Current Status</p>
                        {
                            this.state.selected.map((id) => {
                                return <p>{id}</p>
                            })
                        }
                    </div>
                </div>
                <div className={'half-width inline-block status-change-displays vertical-align-top'}>
                    <div className={'margin-10'}>
                    <p className={'font-bold text-align-center'}>New Status</p>
                        {
                            Object.keys(this.props.qcStatuses).map((status) => {
                                return <p>{status}</p>
                            })
                        }
                    </div>
                </div>
                <div className={'margin-auto half-width'}>
                    <button className={"margin-10 fill-width"}>Submit</button>
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
    qcStatuses: PropTypes.array,
    onSelect: PropTypes.func
};