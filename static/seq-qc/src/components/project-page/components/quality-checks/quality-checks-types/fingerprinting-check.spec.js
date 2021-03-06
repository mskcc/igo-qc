import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import configureStore from "redux-mock-store";
import Provider from "react-redux/lib/components/Provider";
import thunk from "redux-thunk";

import FingerprintingCheck from "./fingerprinting-check";
import {FINGERPRINT_ENTRIES, REDUNDANT_DIFFERENT_RESULT} from "../../../../../mocks/fingerprint-entries";
import {HotTable} from "@handsontable/react";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Run Router', () => {
    let component;

    beforeEach(() => {
        act(() => {
            const props = {project: 'TEST_PID', entries: FINGERPRINT_ENTRIES};
            const store = mockStore({});
            component = mount(<Provider store={store}>
                <FingerprintingCheck {...props}/>
            </Provider>);
        });
    });
    it('Redundant pair information should be filtered from data', async() => {
        const tableProps = component.find(HotTable).props();
        const tableData = tableProps['data'] || [];

        expect(FINGERPRINT_ENTRIES.length).toBe(9); // [ (1,1), (1,2), (1,3), (2,1), (2,2), (2,3), (3,1), (3,2), (3,3) ]
        expect(tableData.length).toBe(3);           // [        (1,2), (1,3),               (2,3),                     ]
    });
    it('Redundant pair w/ different result should NOT be filtered from data', async() => {
        const entries = FINGERPRINT_ENTRIES;
        entries.push(REDUNDANT_DIFFERENT_RESULT);

        const props = {project: 'TEST_PID', entries};
        const store = mockStore({});
        component = mount(<Provider store={store}>
            <FingerprintingCheck {...props}/>
        </Provider>);

        const tableProps = component.find(HotTable).props();
        const tableData = tableProps['data'] || [];

        expect(FINGERPRINT_ENTRIES.length).toBe(10);
        expect(tableData.length).toBe(4);
    });
});

