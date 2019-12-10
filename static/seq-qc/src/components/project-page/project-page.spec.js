import React from 'react';
import { act } from 'react-dom/test-utils';
import { shallow, mount } from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import ProjectPage from './project-page';
import config from "../../config";
import projectInfo from '../../mocks/projectInfo';
import QcTable from "./components/qc-table";

describe('ProjectPage', () => {
    let component;
    let mock;
    let pid;
    beforeEach(() => {
        pid = 'TEST_PID';

        mock = new MockAdapter(axios);
        mock.onGet(`${config.IGO_QC}/projectInfo/${pid}`).reply(200, projectInfo);

        const props = {
            projectMap: {},
            // Param for url-match
            match: {
                params: { pid }
            }
        };
        act(() => {
            component = mount(<ProjectPage {...props}/>);
        });
    });
    it("Project Page passes down props on initialization", () => {
        const qcTable = component.find(QcTable);
        const props = qcTable.props();
        expect(props.project).toBe(pid);
    });

});

