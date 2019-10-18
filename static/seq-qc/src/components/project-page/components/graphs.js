import React, { useState } from 'react';
import Plot from "react-plotly.js";
import PropTypes from 'prop-types';

import '../app.css';
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const Graph = (props) => {
    const [showDescription, setShowDescription] = useState(false);

    const toggleDescription = () => {
        setShowDescription(!showDescription);
    };

    return <div>
        <p className="text-align-center">{props.chart.title}</p>
        <FontAwesomeIcon icon={faQuestionCircle} onClick={toggleDescription}/>
        <p className={showDescription ? 'display-inline' : 'display-none'}>{props.chart.description}</p>
        <Plot data={props.chart.data}
              layout={props.chart.layout}
              config={props.chart.config}
              style={{'z-index': '-1', 'position': 'relative'}}/>
    </div>;
};

export default Graph;
Graph.propTypes = {
    chart: PropTypes.object
};