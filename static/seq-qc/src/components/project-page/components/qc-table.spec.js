import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import QcTable from "./qc-table";
import projectInfo from '../../../mocks/projectInfo';
describe('QcTable', () => {
    let component;

    const pid = 'TEST_PID';

    beforeEach(() => {
        const data = projectInfo.data.data.grid;
        const props = {
            data: Object.values(data.grid),
            headers: data.header,
            qcStatuses: projectInfo.data.data.statuses,
            onSelect: () => {},
            project: pid,
            recipe: '',
            addModalUpdate: () => {},
            updateProjectInfo: () => {},
            columnOrder: projectInfo.data.data.columnOrder
        };
        act(() => {
            component = mount(<QcTable {...props}/>);
        });
    });
    it("Project Page passes down props on initialization", () => {
        // TODO
    });

});

