import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Home from './components/Home.js';
import CellRanger from './cellranger.js';

function App() {
    return   <Router>
                <Switch>
                    <Route exact path="/" component={Home}/>
                    <Route path="/project/:pid" component={CellRanger}/>
                </Switch>
             </Router>
}

export default App;