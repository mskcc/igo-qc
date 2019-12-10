import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import QcTable from "./qc-table";
import projectInfo from '../../../mocks/projectInfo';
describe('QcTable', () => {
    let component;

    const pid = 'TEST_PID';
    const data = projectInfo.data.data;
    const gridData = Object.values(data.grid.grid);
    const headers = data.grid.header;
    const columnOrder = data.columnOrder;

    const updatedProps = {
        data: gridData,
        headers: headers,
        qcStatuses: data.statuses,
        onSelect: () => {},
        project: pid,
        recipe: '',
        addModalUpdate: () => {},
        updateProjectInfo: () => {},
        columnOrder: columnOrder
    };
    const emptyProps = {
        data: [],
        headers: [],
        qcStatuses: {},
        onSelect: () => {},
        project: pid,
        recipe: '',
        addModalUpdate: () => {},
        updateProjectInfo: () => {},
        columnOrder: []
    };

    beforeEach(() => {
        act(() => {
            component = mount(<QcTable {...emptyProps}/>);
            component.setProps(updatedProps);

        });
    });
    it("QCTable receives filtered properties correctly", () => {
        component.update();
        const hotTable = component.find('HotTable').instance();
        const hotTableProps = hotTable.props;

        // Only headers in columnOrder should be shown
        expect(hotTableProps.colHeaders).toStrictEqual(columnOrder);

        // All expected entries are available
        const expectedRows = gridData.map((row) => {return row['QC Record Id']});
        const actualRows = hotTableProps.data.map((row) => {return row['QC Record Id']});
        expect(actualRows).toStrictEqual(expectedRows);
    });


    it('search filters correctly', () => {
        component.update();
        const hotTable = component.find('HotTable').instance();
        expect(hotTable.props.data.length).toBe(7);

        // Filtering on unique record id should return only one row
        const evt = {
            target: {
                value: '6150444'
            }
        };
        component.instance().runSearch(evt);
        expect(hotTable.props.data.length).toBe(1);
    });
});

