import React from 'react';
import { act }  from 'react-dom/test-utils';
import { shallow } from 'enzyme';
import App from "./app";

describe('App', () => {
    let component;
    beforeEach(async () => {
        await act(async() => {
            component = shallow(<App/>);
        });
    });

    it("Project search should parse correct format", () => {
        component.find('input').simulate('change', { target: { value: 'pRoJeCt_314' } });
        component.setProps({});

        expect(component.find('input').props().value).toBe('PROJECT_314');
    });
    it("Project search should transform incorrect format", () => {
        // Should trim whitespace
        component.find('input').simulate('change', { target: { value: ' pRoJeCt_314  ' } });
        component.setProps({});

        expect(component.find('input').props().value).toBe('PROJECT_314');
    });
});
