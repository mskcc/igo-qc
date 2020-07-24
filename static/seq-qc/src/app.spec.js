import React from 'react';
import { act }  from 'react-dom/test-utils';
import { shallow, mount } from 'enzyme';
import App from "./app";
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store'
import Provider from "react-redux/lib/components/Provider";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('App', () => {
    let component;
    beforeEach(async () => {
        const store = mockStore({});
        await act(async() => {
            component = mount(<Provider store={store}>
                <App/>
            </Provider>);
        });
    });

    it("Project search should parse correct format", () => {
        component.find('#project-search').simulate('change', { target: { value: 'pRoJeCt_314' } });
        component.setProps({});

        expect(component.find('#project-search').props().value).toBe('PROJECT_314');
    });
    it("Project search should transform incorrect format", () => {
        // Should trim whitespace
        component.find('#project-search').simulate('change', { target: { value: ' pRoJeCt_314  ' } });
        component.setProps({});

        expect(component.find('#project-search').props().value).toBe('PROJECT_314');
    });
});
