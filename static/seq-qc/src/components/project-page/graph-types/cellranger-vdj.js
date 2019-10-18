import React from 'react';

import '../../../index.css';
import PropTypes from 'prop-types';
import CellRangerCount from "./cellranger-count";
import Graph from '../components/graphs';

const CellRangerVdj = (props) => {
    return <div>
        <p className={"text-align-center font-bold em2"}>{props.title}</p>
        <div className={"table margin-auto"}>
            {props.graphs.map((chart, idx) => {
                return <div key={`${chart.name}-${idx}`} className='table-cell vertical-align-top'>
                    <Graph chart={chart}></Graph>
                </div>
            })}
        </div>
    </div>
};

export default CellRangerVdj;

CellRangerCount.propTypes = {
    title: PropTypes.string,
    graphs: PropTypes.object
};