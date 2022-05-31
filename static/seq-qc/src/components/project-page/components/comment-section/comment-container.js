import React from 'react';
import { Box, Button } from '@material-ui/core';
import { Switch } from '@material-ui/core';
import { Slide } from '@material-ui/core';
import { FormControlLabel } from '@material-ui/core';
import { Comment } from './comment';
import './comment-section.css';
import AddComment from './add-comment';
import { getComments } from '../../../../services/igo-qc-service';

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
        {
            props.commentsData.map((comment) => {
                return (
                    <Comment name={comment.createdBy} date={date} text={comment.comment}/>
                )
            })
        }
    </Box>
  )
);

function CommentContainer(props) {
    const [checked, setChecked] = React.useState(false);
    const [showDialog, setShowDialog] = React.useState(false);
    const [comments, setComments] = React.useState({});
    // const currentUser = useSelector(state => state.user );

    const fetchComments = async () => {
        const urlIdIndex = window.location.href.lastIndexOf('/') + 1;
        const projectId = window.location.href.substring(urlIdIndex);
        getComments(projectId)
            .then((res) => {
                const commentData = res.data;
                setComments(commentData);
            })
            .catch((err) => {
                alert('Error displaying comment(s). Email skigodata@mskcc.org');
            })
      };
    

    const handleChange = () => {
        setChecked((prev) => !prev);
    }
        

    const handleAddComment = () => {
        setShowDialog(true);
    };

    const handleCloseComment = () => {
        setShowDialog(false);
    }

    useEffect(() => {
        fetchComments();
    }, []);

    return (
        <Box className='show-comments-switch'>
            { showDialog && <AddComment isOpen={showDialog} onHandleClose={handleCloseComment} />}
            <FormControlLabel
                control={<Switch color='default' checked={checked} onChange={handleChange} />}
                label="Show comments"
            />
            <Slide direction="left" in={checked} mountOnEnter unmountOnExit>
                <CommentSection commentsData={comments} onAddComment={handleAddComment} />
            </Slide>
        </Box>
    );
}

export default CommentContainer;
