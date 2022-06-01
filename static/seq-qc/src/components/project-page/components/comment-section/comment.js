import React from 'react';
import { Card } from '@material-ui/core';
import { CardHeader } from '@material-ui/core';
import { CardContent } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import { Avatar } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import './comment-section.css';

export const Comment = ({name, date, text}) => {
    if (name === null) {
        name = 'Run-QC User';
    }
    const avatarLetter = name.charAt(0);
    return (
        <Card elevation={3} className='comment-card'>
            <CardHeader
                avatar={
                    <Avatar className='avatar'>
                        {avatarLetter}
                    </Avatar>
                }
                // action={
                // <IconButton aria-label="delete">
                //     <DeleteIcon />
                // </IconButton>
                // }
                title={name}
                subheader={date}
            />
            <CardContent>
                <Typography variant="body2">
                    {text}
                </Typography>
            </CardContent>
        </Card>
    )
}