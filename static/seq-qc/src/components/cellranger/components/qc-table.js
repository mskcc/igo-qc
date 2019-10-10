import React from 'react';
import PropTypes from 'prop-types';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css'

class QcTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            hotTableRef: React.createRef()
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        if(this.props !== prevProps){
            let data = [];
            for(let sample of this.props.data){
                const row = [];
                for(let col of this.props.headers){
                    row.push(sample[col]);
                }
                data.push(row);
            };
            this.setState({data});
        }
    }

    afterSelection = (rowIdx) => {
        const row = this.state.data[rowIdx];
        const rowObject = {};
        for(let i = 0; i<row.length; i++){
            rowObject[this.props.headers[i]] = row[i]
        }
        this.props.onSelect(rowObject);
    };

    render() {
        // TODO - this was done to prevent any rendering of hot-table. Needed?
        if(this.state.data.length === 0 || this.props.headers.length === 0) return <div></div>
        return (
            <HotTable
                ref={this.hotTableRef}
                licenseKey="non-commercial-and-evaluation"
                id="qc-grid"
                data={this.state.data}
                colHeaders={this.props.headers}
                rowHeaders={true}
                readOnly="true"
                filters="true"
                dropdownMenu={['filter_by_value', 'filter_action_bar', 'remove_col']}
                columnSorting="true"
                fixedRowsTop={0}
                fixedColumnsLeft={0}
                preventOverflow="horizontal"
                afterSelection={this.afterSelection}
            />
        );
    }
}

export default QcTable;

QcTable.propTypes = {
    data: PropTypes.array,
    headers: PropTypes.array,
    onSelect: PropTypes.func
};