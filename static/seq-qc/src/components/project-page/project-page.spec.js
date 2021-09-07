import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount, shallow } from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import ProjectPage from './project-page';
import config from "../../config";
import projectInfo from '../../mocks/projectInfo';
import ngsStatsGraph from '../../mocks/cell-ranger';
import QcTable from "./components/qc-table";
import Provider from "react-redux/lib/components/Provider";
import thunk from "redux-thunk";
import configureStore from "redux-mock-store";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('ProjectPage', () => {
    let component;
    let mock;
    let pid;
    let store;
    beforeEach(() => {
        pid = 'TEST_PID';

        mock = new MockAdapter(axios);
        mock.onGet(new RegExp(`${config.IGO_QC}/projectInfo/.*`)).reply(200, projectInfo);
        mock.onGet(new RegExp(`${config.IGO_QC}/getCellRangerSample.*`)).reply(200, ngsStatsGraph);

        store = mockStore({
            projects: {
                [pid]: {}
            }
        });
        act(() => {
            const props = {
                // Param for url-match
                match: {
                    params: { pid }
                },
                addModalUpdate: () => {}
            };
            component = mount(<Provider store={store}>
                <ProjectPage {...props}/>
            </Provider>);
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
    it("When projectInfo response is an error, component does not render loaders", async () => {
        // Re-mock this call since we want an empty response (different from the mocking in 'beforeEach')
        mock = new MockAdapter(axios);
        mock.onGet(`${config.IGO_QC}/projectInfo/${pid}`).reply(404, {});
        await act( async () => {
            // Re-mount w/ the failed axios response
            const props = {
                // Param for url-match
                match: {
                    params: { pid: pid }
                },
                addModalUpdate: () => {}
            };
            component = mount(<Provider store={store}>
                    <ProjectPage {...props}/>
                </Provider>);
        });

        component.setProps({});     // Update the component

        expect(component.find('.loader').length).toBe(1);       // Section: [GraphContainer] <- dependent on ngsStats
        expect(component.find('.load-error').length).toBe(2);   // Correctly renders the load errors
    });
});

