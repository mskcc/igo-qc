import React, { useState } from 'react';

import '../../../index.css';
import PropTypes from 'prop-types';
import Graph from '../components/graphs';
import MuiDownshift from 'mui-downshift'

const CellRangerCount = (props) => {
    // Only 'name': 'tsne_clustering' graphs have a 'filters' field
    // TODO - constants
    const tsneGraphs = props.graphs.filter((chart) => chart['name'] === 'tsne_clustering');
    const tsneFilters = tsneGraphs.map((chart) => { return { 'label': chart['filters']['Clustering Type']} });
    const otherGraphs = props.graphs.filter((chart) => chart['name'] !== 'tsne_clustering');
    const [selectedFilter, setSelectedFilter] = useState(tsneFilters[0].label);

    const handleToggle = (evt) => {
        if(evt) setSelectedFilter(evt.label);
        else setSelectedFilter('');         // Deleted
    };

    return <div>
        <div className={"table margin-auto"}>
            {otherGraphs.map((chart, idx) => {
                return <div key={`${chart.name}-${idx}`}
                            className='table-cell vertical-align-top'>
                    <Graph chart={chart}></Graph>
                </div>
            })}
            <div>
                <MuiDownshift
                    items={tsneFilters}
                    onChange={handleToggle}
                    defaultSelectedItem={{'label': selectedFilter}}
                    loading={false}
                    includeFooter={false}
                    menuItemCount={5}
                    focusOnClear
                    getInputProps={() => ({
                        className: 'margin-auto half-width',
                    })}
                />
                <div>
                    {
                        tsneGraphs.filter((chart) => chart['filters']['Clustering Type'] === selectedFilter)
                               .map((chart) => {
                                    return <div key={chart.name} className='table-cell vertical-align-top'>
                                        <Graph chart={chart}></Graph>
                                    </div>
                                })
                    }
                </div>
            </div>
        </div>
    </div>
};

export default CellRangerCount;

CellRangerCount.propTypes = {
    title: PropTypes.string,
    graphs: PropTypes.array
};