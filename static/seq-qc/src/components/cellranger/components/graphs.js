import React from 'react';
import Plot from "react-plotly.js";

import '../app.css';

class Graph extends React.Component {
    render() {
        return <div>
            <p className="text-align-center">{this.props.chart.title}</p>
            <Plot data={this.props.chart.data}
                  layout={this.props.chart.layout}
                  config={this.props.chart.config}/>
        </div>;
    }
}

export default Graph;