import React, { useState } from 'react';

import '../../../index.css';
import PropTypes from 'prop-types';
import Graph from '../components/graphs';
import MuiDownshift from 'mui-downshift'

/*
    <!-- NOTE: multiple charts depend on this -->
<div ng-repeat="(title, filter) in data.filters" class="cluster-filter">
<div class="btn-group filter-btn-group" uib-dropdown>
    <button id="filter-{{ $index }}" type="button" class="btn btn-primary" uib-dropdown-toggle>
        {{ filter.selected }} &nbsp; <span class="caret"></span>
    </button>
    <ul uib-dropdown-menu role="menu" aria-labelledby="filter-{{ $index }}" class="dropdown-menu-right cluster-menu">
        <li ng-repeat="value in filter.values" role="menuitem">
            <a href ng-click="selectFilterValue(filter, value)">{{ value }}</a>
        </li>
    </ul>
</div>
<h4 class="filter-title">{{ title }}:</h4>
</div><div class="summary">
<div class="chart_card_column">
<div class="chart_card" ng-repeat="chart in charts" ng-if="chart.name == 'tsne_counts'">
    <div class="has_desc" onclick="show_description(event)" ng-cloak>
        <div class="summary_description">{{ chart.description }}</div>
    </div>
    <h2>{{ chart.title }}</h2>
    <div chart-div chart="chart" id="chart-div-{{ $index }}"></div>
</div>  </div>
 */


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
        <p className={"text-align-center font-bold em2"}>{props.title}</p>
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