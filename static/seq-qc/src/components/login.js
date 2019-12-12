import React, { useState, useEffect } from 'react';
import { authenticate } from '../services/igo-qc-service';
import PropTypes from 'prop-types';
import Graph from "./project-page/components/graphs";
import { refresh } from "../services/igo-qc-service";

const Login = (props) => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');

    // Refresh access token if valid access_token is present in sessionSTorage
    const accessToken = sessionStorage.getItem('access_token');
    const refreshToken = sessionStorage.getItem('refresh_token');
    if( accessToken && accessToken !== "undefined" &&
        refreshToken && refreshToken !== "undefined"){
        refresh().then((resp) => {
            // If refresh
            const access_token = resp['access_token'];
            if(access_token){
                // Update access token to parent
                props.setToken(access_token)
            }
        })
    }

    const onSubmit = (evt) => {
        evt.preventDefault();
        authenticate(userName, password).then((resp)=>{
            sessionStorage.setItem("access_token", resp.access_token);
            sessionStorage.setItem("refresh_token", resp.refresh_token);
            props.setToken(resp.access_token);
        });
    };

    return <div className="margin-top-15">
            <div className={"box margin-auto text-align-center fill-width"}>
                <h3 className="font-bold">Login to Sequencing QC</h3>
                <form onSubmit={onSubmit}>
                    <div className="fill-width margin-bottom-15">
                        <input onChange={(evt) => {setUserName(evt.target.value)}}
                               className="input font-size-24 fill-width"
                               name="username"
                               placeholder="MSK Username"
                               autoFocus=""/>
                    </div>
                    <div className={"fill-width margin-bottom-15"}>
                        <input onChange={(evt) => {setPassword(evt.target.value)}}
                               className="input font-size-24 fill-width"
                               type="password"
                               name="password"
                               placeholder="Your Password"/>
                    </div>
                    <input type="submit" value="Submit" className="btn-info hover font-size-24 half-width margin-auto"></input>
                </form>
            </div>
    </div>
};

export default Login;
Graph.propTypes = {
    updateToken: PropTypes.function
};
