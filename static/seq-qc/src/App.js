import React, { useState } from 'react';
import Login from './components/login';
import HomePage from "./components/home-page";

import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";

const App = () => {
    const [token, setToken] = useState(null);
    if(token){
        return <HomePage/>
    } else {
        return <Login setToken={setToken}></Login>
    }
};

export default App;
