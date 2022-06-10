import React from 'react';
import { Card } from '@material-ui/core';
import { CardContent } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import './comment-section.css';

export const Comment = ({name, date, text}) => {
    if (name === null) {
        name = 'Run-QC User';
    }
    return (
        <Card elevation={3} className='comment-card'>
            <div className='card-header'>
                <Typography className='username' variant="body2">
                    {name}
                </Typography>
                <Typography className='subheader' variant="body2">
                    {date}
                </Typography>
            </div>
            <CardContent>
                <Typography className='comment-card-text' variant="body2">
                    {text}
                </Typography>
            </CardContent>
        </Card>
    )
}