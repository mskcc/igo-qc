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
    return (
        <Card elevation={3} className='comment-card'>
            <CardHeader
                avatar={
                    <Avatar className='avatar'>
                        S
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
                This impressive paella is a perfect party dish and a fun meal to cook
                together with your guests. Add 1 cup of frozen peas along with the mussels,
                if you like.
                </Typography>
            </CardContent>
        </Card>
    )
}