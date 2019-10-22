// TODO - When fully integrated
 import React, { useState, useEffect } from 'react';
 import PropTypes from 'prop-types';

import { CELL_RANGER_APPLICATION } from '../../constants.js';
import {Link} from "react-router-dom";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faArrowAltCircleRight, faCheckSquare, faSquare} from '@fortawesome/free-solid-svg-icons'

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
    // Bit convoluted, but props.projects should be null initially as it is loaded from a service call.
    const [fields, setFields] = useState([]);
    const [headers, setHeaders] = useState([]);

    useEffect(() => {
        setFieldsFromProjects(props.projects);
    }, [props.projects]);

    /**
     * Determines whether input is valid list of projects that can be rendered
     *
     * @param projects, Object[]
     * @returns {*|boolean}
     */
    const validProjects = (projects) => {
        return projects && projects.length > 0;
    };

    const setFieldsFromProjects = (projects) => {
        if(validProjects(projects)){
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
            <th></th>
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
                        <td  className="project-field field-header project-row-link" key={`${project.requestId}-link`}>
                            <Link to={`/projects/${project.requestId}`}>
                                <FontAwesomeIcon className="em5 mskcc-medium-blue" icon={faArrowAltCircleRight}/>
                            </Link>
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
        if(validProjects(props.projects)){
            // LOADED - Data Available
            return <table className="project-table fill-width border-collapse">
                {renderHeaders()}
                {renderProjects()}
            </table>
        } else if (props.projects === null) {
            // LOADING - Input properties are still loading
            return <div className="loader margin-auto"></div>
        } else {
            // LOADED - No Data
            return <div>
                <p className={'text-align-center'}>{`No "${props.name}" Projects`}</p>
            </div>
        }
    };

    return (
        <div>
            <div>
                <p className="margin-0 font-size-24">{props.name}</p>
            </div>
            {renderTable()}
        </div>
    );
};

export default ProjectRouter;

ProjectRouter.propTypes = {
    name: PropTypes.string,
    projects: PropTypes.array   // NULL ALLOWED
};
