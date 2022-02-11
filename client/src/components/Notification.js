import React, { useContext } from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { SocketContext } from '../SocketContext';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    justifyContent: 'center'
  }
}));

const Notification = () => {
  const { answerCall, call, callAccepted } = useContext(SocketContext);
  const classes = useStyles();
  return (
    <>
      {call.isReceivedCall && !callAccepted && (
        <div className={classes.container}>
          <h1>{call.name} is calling</h1>
          <Button variant='contained' color='primary' onClick={answerCall}>
            Answer
          </Button>
          {/* <Button variant='contained' color='primary' onClick={answerCall}>
            Reject
          </Button> */}
        </div>
      )}
    </>
  )
}

export default Notification