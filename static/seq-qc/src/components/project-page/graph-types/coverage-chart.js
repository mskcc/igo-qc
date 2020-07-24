import React, {useState, useEffect} from 'react';
import Plot from "react-plotly.js";
import PropTypes from 'prop-types';
import {HotTable} from "@handsontable/react";

const CoverageChart = (props) => {
    const [coverages, setCoverages] = useState([50, 70, 100, 150, 250]);
    const [tumorCounts, setTumorCounts] = useState([]);
    const [normalCounts, setNormalCounts] = useState([]);

    const height = 300;
    const width = 600;

    // Update counts with the latest coverages
    useEffect(() => {
        updateCounts(props.data, coverages);
    }, [coverages, props.data]);

    const formatLabels = (categories) => {
        return categories.map((category) => { return `${category}X`});
    };

    const updateCounts = (data, categories) => {
        const tempTumorCounts = Array(coverages.length).fill(0);
        const tempNormalCounts = Array(coverages.length).fill(0);

        for(const entry of data){
            const coverage = entry['Sum MTC'] || 0;
            const type = entry['Tumor or Normal'] || '';
            for(let i = 0; i<categories.length; i++){
                if(categories[i]<=coverage){
                    if(type === 'Tumor'){
                        tempTumorCounts[i] = tempTumorCounts[i] + 1
                    } else if(type === 'Normal'){
                        tempNormalCounts[i] = tempNormalCounts[i] + 1
                    }
                }
            }
        }

        setTumorCounts(tempTumorCounts);
        setNormalCounts(tempNormalCounts);
    };

    const tumor = {
        x: formatLabels(coverages),
        y: tumorCounts,
        name: 'Tumor',
        type: 'bar',
        marker: {color: '#b687b8'}
    };
    const normal = {
        x: formatLabels(coverages),
        y: normalCounts,
        name: 'Normal',
        type: 'bar',
        marker: {color: '#319ae8'}
    };
    const data = [tumor, normal];
    const layout = {barmode: 'group', width: width, height: height, title: 'SuM MTC Quantities - Tumor vs. Normal'}; // width: 320, height: height,

    const getTableData = () => {
        const headers = ['', 'Tumor', 'Normal'];
        const tableData = [ headers ];
        for(let i = 0; i<coverages.length; i++){
            const row = [`${coverages[i]}X`, tumorCounts[i], normalCounts[i]];
            tableData.push(row);
        }
        return tableData;
    };
    return <div>
        <div className={"inline-block pos-rel"} style={{'height': height, 'width': '300px'}}>
            <HotTable licenseKey="non-commercial-and-evaluation"
                      id="coverage-chart"
                      data={getTableData()}
                      style={ {'width': '175px', 'height': '160px'} }/>
        </div>
        <Plot data={data}
              layout={layout}
              style={{'zIndex': '1', 'position': 'relative', 'display': 'inline-block'}}
              marker={{'color': 'red'}}/>
    </div>
};

export default CoverageChart;
CoverageChart.propTypes = {
    data: PropTypes.array
};
