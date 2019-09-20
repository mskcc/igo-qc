// TODO - When fully integrated
// import React from 'react';
// import ReactDOM from 'react-dom';

import App from './App.js';
import { loadFile, loadCss } from './utils/load.js';
const e = React.createElement;

loadCss(loadFile('./static/seq-qc/src/index.css'));
loadCss(loadFile('./static/css/style.css'));

const domContainer = document.querySelector('#react_app');
ReactDOM.render(e(App), domContainer);