import React from 'react';
import { Box, Button } from '@material-ui/core';
import { Switch } from '@material-ui/core';
import { Slide } from '@material-ui/core';
import { FormControlLabel } from '@material-ui/core';
import { Comment } from './comment';
import './comment-section.css';
import AddComment from './add-comment';

const CommentSection = React.forwardRef((props, ref) => (
    <Box className='comment-container' ref={ref}>
        <Button
            size='small'
            variant='contained'
            className='action-button add-comment-button'
            onClick={props.onAddComment}
        >
            +
        </Button>
        <Comment name='Steph' date='October 23, 2021' text=''/>
        <Comment name='Steph' date='October 23, 2021' text=''/>
        <Comment name='Steph' date='October 23, 2021' text=''/>
        <Comment name='Steph' date='October 23, 2021' text=''/>
        <Comment name='Steph' date='October 23, 2021' text=''/>
        <Comment name='Steph' date='October 23, 2021' text=''/>
        <Comment name='Steph' date='October 23, 2021' text=''/>
        <Comment name='Steph' date='October 23, 2021' text=''/>
    </Box>
  )
);

function CommentContainer(props) {
    const [checked, setChecked] = React.useState(false);
    const [showDialog, setShowDialog] = React.useState(false);
    // const currentUser = useSelector(state => state.user );

    const handleChange = () => {
        setChecked((prev) => !prev);
    };

    const handleAddComment = () => {
        setShowDialog(true);
    };

    const handleCloseComment = () => {
        setShowDialog(false);
    }

    return (
        <Box className='show-comments-switch'>
            { showDialog && <AddComment isOpen={showDialog} onHandleClose={handleCloseComment} />}
            <FormControlLabel
                control={<Switch color='default' checked={checked} onChange={handleChange} />}
                label="Show comments"
            />
            <Slide direction="left" in={checked} mountOnEnter unmountOnExit>
                <CommentSection onAddComment={handleAddComment} />
            </Slide>
        </Box>
    );
}

export default CommentContainer;
