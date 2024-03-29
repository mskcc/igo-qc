import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons'
import config from '../../config.js';
import { PROJECT_FLAGS,  LIMS_REQUEST_ID } from "../../resources/constants";
import {getFlagIcon} from "../project-page/components/quality-checks/quality-checks-utils";
import Tooltip from '@material-ui/core/Tooltip';

// ALL POSSIBLE FIELDS OF ROWS
const TEXT_FIELDS = {
    "pi": "PI",
    "requestType": "Type",
    [LIMS_REQUEST_ID]: "Request Id",
    "run": "Recent Runs",
    "date": "Date of Latest Stats",
    "numComments": "Number of Comments"
};
const ICON_FIELDS = {
    [PROJECT_FLAGS]: "Quality Checks"
};
const ALL_FIELDS = Object.assign(Object.assign({}, ICON_FIELDS), TEXT_FIELDS);
/**
 * Router for Projects
 */
const ProjectRouter = ({name, tooltip, projects}) => {
    const [textFields, setTextFields] = useState([]);
    const [iconFields, setIconFields] = useState([]);
    const [headers, setHeaders] = useState([]);

    useEffect(() => {
        setFieldsFromProjects(projects);
    }, [projects]);

    /**
     * Determines whether input is valid list of projects that can be rendered
     *
     * @param projects, Object[]
     * @returns {*|boolean}
     */
    const validProjects = (projects) => {
        return projects && projects.length > 0;
    };

    /**
     * Filters out any field not present in any of the input projects
     *
     * @param project
     * @param fieldMap
     * @returns {string[]}
     */
    const getPresentFields = (projects, fieldMap) => {
        const presentFields = Object.keys(fieldMap).filter((field) => {
            // Fields not present will be evaluated to false and filtered out
            for(const project of projects){
                if (project[field]) return true;
            }
            return false;
        });
        return presentFields;
    };

    const setFieldsFromProjects = (projects) => {
        if(validProjects(projects)){
            const presentTextFields = getPresentFields(projects, TEXT_FIELDS);
            const presentIconFields = getPresentFields(projects, ICON_FIELDS);

            // Gets human-readable headers from the valid fields of object
            const rowFields = presentTextFields.concat(presentIconFields);
            const headersUpdate = rowFields.map((field) => ALL_FIELDS[field]);

            setTextFields(presentTextFields);
            setIconFields(presentIconFields);

            setHeaders(headersUpdate);
        }
    };

    const renderHeaders = () => {
        return <thead><tr className="fill-width">
            <th className={"light-blue-border"}></th>
            { headers.map( (field) =>
                <th className="project-field light-blue-border" key={field}>
                    <p className="font-size-16 font-bold">{field}</p>
                </th>)
            }
        </tr></thead>;
    };

    const renderProjects = () => {
        const projectElements = [];
        for( const project of projects ){
            const textValues = textFields.map( (field) => project[field] );
            const iconValues = iconFields.map( (field) => project[field] );
            const element = <tr className="fill-width project-row" key={project.requestId}>
                        <td className="project-field field-header project-row-link text-align-center light-blue-border" key={`${project.requestId}-link`}>
                            <Link to={`${config.SITE_HOME}projects/${project.requestId}`}>
                                <FontAwesomeIcon className="em5 mskcc-medium-blue" icon={faArrowAltCircleRight}/>
                            </Link>
                        </td>
                        {textValues.map( field =>
                            <td className="project-field field-header text-align-center light-blue-border" key={field}>
                                <p className="font-size-12">{field}</p>
                            </td>)
                        }
                        {iconValues.map( field =>
                            <td className="project-field field-header text-align-center light-blue-border" key={field}>
                                {getFlagIcon(field)}
                            </td>)
                        }
                    </tr>;
            projectElements.push(element);
        }
        return <tbody>{projectElements}</tbody>;
    };
    const renderTable = () => {
        // Visualize projects if present and state has been populated w/ fields to visualize
        if(validProjects(projects)){
            // LOADED - Data Available
            return <table className="project-table fill-width border-collapse">
                {renderHeaders()}
                {renderProjects()}
            </table>
        } else if (projects === null) {
            // LOADING - Input properties are still loading
            return <div className="loader margin-auto"></div>
        } else {
            // LOADED - No Data
            return <div>
                <p className={'text-align-center'}>No Projects</p>
            </div>
        }
    };

    return (
        <div className={"projects-table-container"}>
            <div>
                <Tooltip title={tooltip} aria-label={tooltip} placement="left">
                    <p className="margin-0 font-size-24 inline-block">{name}</p>
                </Tooltip>

            </div>
            {renderTable()}
        </div>
    );
};

export default ProjectRouter

ProjectRouter.propTypes = {
    name: PropTypes.string,
    projects: PropTypes.array   // NULL ALLOWED
};
