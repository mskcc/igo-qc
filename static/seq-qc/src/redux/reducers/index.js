import { combineReducers } from "redux";
import projects from "./projects";
import user from "./users";

export default combineReducers({ projects, user });
