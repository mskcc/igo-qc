import React from 'react';

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
    const tsneClusteringGraphs = props.graphs.filter((chart) => chart['name'] === 'tsne_clustering');
    const tsneFilters = tsneClusteringGraphs.map((chart) => chart['filters']);
    const otherGraphs = props.graphs.filter((chart) => chart['name'] !== 'tsne_clustering');

    return <div>
        <p className={"text-align-center font-bold em2"}>{props.title}</p>
        <div className={"table margin-auto"}>
            {otherGraphs.map((chart, idx) => {
                return <div key={`${chart.name}-${idx}`} className='table-cell vertical-align-top'>
                    <Graph chart={chart}></Graph>
                </div>
            })}
        </div>
        <div>
            <MuiDownshift
                items={tsneFilters}
                onChange={console.log}
                onStateChange={console.log}
                onSelect={console.log}
                loading={false}
                includeFooter={false}
                menuItemCount={5}
                focusOnClear
            />
        </div>
    </div>
};

export default CellRangerCount;

CellRangerCount.propTypes = {
    title: PropTypes.string,
    graphs: PropTypes.object
};