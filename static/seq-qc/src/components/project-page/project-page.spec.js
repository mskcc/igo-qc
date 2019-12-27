import React from 'react';
import { act } from 'react-dom/test-utils';
import { shallow, mount } from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import ProjectPage from './project-page';
import config from "../../config";
import projectInfo from '../../mocks/projectInfo';
import ngsStatsGraph from '../../mocks/cell-ranger';
import QcTable from "./components/qc-table";

describe('ProjectPage', () => {
    let component;
    let mock;
    let pid;
    beforeEach(() => {
        pid = 'TEST_PID';

        mock = new MockAdapter(axios);
        mock.onGet(new RegExp(`${config.IGO_QC}/projectInfo/.*`)).reply(200, projectInfo);
        mock.onGet(new RegExp(`${config.NGS_STATS}/ngs-stats/getCellRangerSample.*`)).reply(200, ngsStatsGraph);

        act(() => {
            const props = {
                // Param for url-match
                match: {
                    params: { pid }
                },
                addModalUpdate: () => {}
            };
            component = mount(<ProjectPage {...props}/>);
        });
    });
    it("On initialization, component displays loaders", () => {
        expect(component.find('.loader').length).toBe(3);       // Sections: [Summary, GraphContainer, Grid]
        expect(component.find('.load-error').length).toBe(0);   // No load errors on correct response
    });
    it("On initialization, component passes down props on initialization", () => {
        const qcTable = component.find(QcTable);
        const qcTableProps = qcTable.props();
        expect(qcTableProps.project).toBe(pid);
    });
    it("On empty projectInfo Response, component does not render loaders", async () => {
        // Re-mock this call since we want an empty response (different from the mocking in 'beforeEach')
        mock = new MockAdapter(axios);
        mock.onGet(`${config.IGO_QC}/projectInfo/${pid}`).reply(200, {data: {data: {}}});
        await act( async () => {
            const props = {
                // Param for url-match
                match: {
                    params: { pid: '' }
                },
                addModalUpdate: () => {}
            };
            component = mount(<ProjectPage {...props}/>);
        });

        component.setProps({});     // Update the component
        expect(component.find('.loader').length).toBe(1);       // Section: [GraphContainer] <- dependent on ngsStats
        expect(component.find('.load-error').length).toBe(2);   // Correctly renders the load errors
    });
});

