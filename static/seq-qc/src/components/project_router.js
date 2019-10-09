// TODO - When fully integrated
 import React, { useState, useEffect } from 'react';
 import PropTypes from 'prop-types';

import { CELL_RANGER_APPLICATION } from '../constants.js';
import {Link} from "react-router-dom";

// ALL POSSIBLE FIELDS OF ROWS
const FIELD_MAP = {
    "pi": "PI",
    "requestType": "Type",
    "requestId": "Request Id",
    "run": "Recent Runs",
    "date": "Date of Latest Stats"
};

/**
 * Router for Projects
 */
const ProjectRouter = (props) => {
    const [fields, setFields] = useState([]);
    const [headers, setHeaders] = useState([]);

    useEffect(() => {
        setFieldsFromProjects(props.projects);
    }, [props.projects]);

    const setFieldsFromProjects = (projects) => {
        if(projects && projects.length > 0){
            // Only take the fields that are present in the project, based on the first project
            const firstProject = projects[0];
            const fieldsUpdate = Object.keys(FIELD_MAP).filter((field) => {
                return firstProject[field]
            });
            const headersUpdate = fieldsUpdate.map((field) => FIELD_MAP[field]);
            setFields(fieldsUpdate);
            setHeaders(headersUpdate);
        }
    };

    const renderHeaders = () => {
        return <thead><tr className="fill-width">
            <th>LINK</th>
            { headers.map( (field) =>
                <th className="project-field" key={field}>
                    <p className="font-size-16 font-bold">{field}</p>
                </th>)
            }
        </tr></thead>;
    };
    const renderProjects = () => {
        const projectElements = [];
        for( const project of props.projects ){
            const values = fields.map( (field) => project[field] );
            const element = <tr className="fill-width project-row" key={project.requestId}>
                        <td  className="project-field field-header" key={`${project.requestId}-link`}>
                            <Link to={`/projects/${project.requestId}`}>link</Link>
                        </td>
                        {values.map( field =>
                            <td className="project-field field-header" key={field}>
                                <p className="font-size-12">{field}</p>
                            </td>)
                        }
                    </tr>;
            projectElements.push(element);
        }
        return <tbody>{projectElements}</tbody>;
    };
    const renderTable = () => {
        // Visualize projects if present and state has been populated w/ fields to visualize
        if(props.projects && fields.length > 0){
            return <table className="project-table fill-width">
                {renderHeaders()}
                {renderProjects()}
            </table>
        } else {
            return <div></div>
        }
    };

    return (
        <div>
            <div>
                <p className="font-size-24">{props.name}</p>
            </div>
            {renderTable()}
        </div>
    );
};

export default ProjectRouter;

ProjectRouter.propTypes = {
    name: PropTypes.string,
    projects: PropTypes.array
};
