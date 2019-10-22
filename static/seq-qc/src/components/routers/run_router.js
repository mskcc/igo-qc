import React from 'react';
import PropTypes from 'prop-types';

/**
 * Router for Recent Runs
 */
const RunRouter = (props) => {
    const renderHeaders = () => {
        const headers = ["Report Generated", "Lane Summary", "Run Stats"];

        return <thead><tr className="fill-width">
            <th>LINK</th>
            { headers.map( (field) =>
                <th className="project-field" key={field}>
                    <p className="font-size-16 font-bold">{field}</p>
                </th>)
            }
        </tr></thead>;
    };
    const renderRuns = () => {
        const runElements = [];
        for( const run of props.projects ){
            const element = <tr className="fill-width project-row" key={run.requestId}>
                <td className="project-field field-header" key={`${run.requestId}-date`}>
                    <p className="font-size-12">{run.date}</p>
                </td>
                <td className="project-field field-header" key={`${run.runName}-href`}>
                    <a href={run.path}>{ run.runName }</a>
                </td>
                <td>
                    <button className="btn btn-primary">
                        <a href={run.runStats} target="_blank">View Run Stats</a>
                    </button>
                </td>
            </tr>;
            runElements.push(element);
        }
        return <tbody>{runElements}</tbody>;
    };

    const hasData = () => {return props.projects && props.projects.length > 0};
    const noData = () => {return props.projects && props.projects.length === 0};
    const loadingData = () => {return props.projects === null;};
    const renderTable = () => {
        // Visualize projects if present and state has been populated w/ fields to visualize
        if(hasData()){
            return <table className="project-table fill-width">
                {renderHeaders()}
                {renderRuns()}
            </table>
        } else if(noData()) {
            return <div><p className={'text-align-center'}>No Runs available</p></div>
        } else if(loadingData()){
            return <div className="loader margin-auto"></div>;
        } else {
            // Shouldn't ever be reached
            return <div><p className={'text-align-center'}>ERROR</p></div>
        }
    };

    return (
        <div>
            {renderTable()}
        </div>
    );
};

export default RunRouter;

RunRouter.propTypes = {
    projects: PropTypes.array
};
