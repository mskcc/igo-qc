import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { TextField } from '@material-ui/core';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';

export default function AddComment(props) {
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [nameError, setNameError] = useState(false);
    const [commentError, setCommentError] = useState(false);

    const onSubmit = () => {
        if (!name.length > 0) {
            setNameError(true);
        }
        if (!comment.length > 0) {
            setCommentError(true);
        }
        if ((!nameError && !commentError) && (name.length > 0 && comment.length > 0)) {
            alert('submitted!');
        }
    }

    const onNameChange = (event) => {
        setName(event.target.value);
        if (event.target.value === '') {
            setNameError(true);
        } else {
            setNameError(false);
        }
    }

    const onCommentChange = (event) => {
        setComment(event.target.value);
        if (event.target.value === '') {
            setCommentError(true);
        } else {
            setCommentError(false);
        }
    }

    const handleClose = () => {
        props.onHandleClose();
    };

    return (
        <div>
            <Dialog open={props.isOpen} onClose={handleClose}>
                <DialogTitle className='comment-dialog'>New Comment</DialogTitle>
                <DialogContent>
                    <TextField
                        error={nameError}
                        required
                        autoFocus
                        margin="dense"
                        id="nameField"
                        label="Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={onNameChange}
                    />
                    <TextField
                        error={commentError}
                        id="commentField"
                        label="Comment"
                        required
                        multiline
                        rows={6}
                        defaultValue=""
                        variant="filled"
                        fullWidth
                        onChange={onCommentChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={onSubmit}>Add Comment</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}