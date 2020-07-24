import { SET_PROJECTS } from "../actionTypes";

const initialState = {};

const projects = (state = initialState, action) => {
    switch (action.type) {
        case SET_PROJECTS: {
            return action.payload;
        }
        default: {
            return state;
        }
    }
};

export default projects;
