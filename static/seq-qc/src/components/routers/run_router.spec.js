import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import config from "../../config";
import RunRouter from "./run_router";
import recentRuns from '../../mocks/recent-runs';

describe('Run Router', () => {
    let component;
    let mock;
    const props = { addModalUpdate: () => {} };

    it("Run Router displays load on service call", async() => {
        /* TODO - "Warning: An update to RunRouter inside a test was not wrapped in act"
         * Treating above warning as ok :/
         * Some support issues w/ enzyme & hooks - https://github.com/airbnb/enzyme/issues/2011
         */
        await act(async() => {
            // No mocking of actual data
            component = mount(<RunRouter {...props}/>);
        });
        component.setProps({}); // Update the component
        expect(component.find('.loader').length).toBe(1);
        expect(component.find('.project-table').length).toBe(0);
    });
    it("Run Router displays data when data loads", async() => {
        await act(async() => {
            mock = new MockAdapter(axios);
            mock.onGet(`${config.IGO_QC}/getRecentRuns?days=7`).reply(200, recentRuns);
            component = mount(<RunRouter {...props}/>);
        });

        component.setProps({}); // Update the component

        expect(component.find('.loader').length).toBe(0);
        expect(component.find('.project-table').length).toBe(1);
    });
});

