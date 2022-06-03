import React, { useState, useEffect } from 'react';
import { Button } from '@material-ui/core';
import { TextField } from '@material-ui/core';
import { Dialog, DialogActions, DialogContent } from '@material-ui/core';
import { addComment } from '../../../../services/igo-qc-service';

const AddComment = (props) => {
    const [name, setName] = useState('Run-QC User');
    const [comment, setComment] = useState('');
    const [commentError, setCommentError] = useState(false);

    const onSubmit = () => {
        if (!comment.length > 0) {
            setCommentError(true);
        }
        if (!commentError && comment.length > 0) {
            const urlIdIndex = window.location.href.lastIndexOf('/') + 1;
            const projectId = window.location.href.substring(urlIdIndex);
            addComment(projectId, comment, name)
                .then((res) => {
                    props.handleAddedComment();
                    handleClose();
                })
                .catch((err) => {
                    console.log(err);
                    alert('Error submitting comment. Email skigodata@mskcc.org');
                    handleClose();
                })
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

    useEffect(() => {
        const nameFromSession = window.sessionStorage.getItem("runQCUsername");
        if (nameFromSession && nameFromSession.length) {
            setName(nameFromSession);
        }
    }, []);

    return (
        <div>
            <Dialog open={props.isOpen} onClose={handleClose}>
                <h3 className='comment-dialog comment-dialog-title'>New Comment</h3>
                <DialogContent>
                    <p className='comment-username'>{name}</p>
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

export default AddComment;
