import React from 'react';
import ReactDOM from 'react-dom';

import App from './App.js';
const e = React.createElement;

const domContainer = document.querySelector('#react_app');
ReactDOM.render(e(App), domContainer);