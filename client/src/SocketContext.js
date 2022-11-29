import React, { useState, createContext, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('http://localhost:5000');

const ContextProvider = ({ children }) => {
    const [stream, setStream] = useState(null);
    const [otherUserStream, setOtherUserStream] = useState(null);
    const [me, setMe] = useState('');
    const [userToCall, setUserToCall] = useState('');
    const [callAcceptingUser, setCallAcceptingUser] = useState('');
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        socket.on('me', id => {
            setMe(id);
        });

        socket.on('calluser', ({ from, name: callerName, signal }) => {
            setCall({ isReceivedCall: true, from, name: callerName, signal });
        });

        socket.on('callended', () => {
            if (connectionRef.current) {
                setCallEnded(true);
                connectionRef.current.destroy();
                window.location.reload();
            }
        });
    }, []);

    useEffect(() => {
        if (otherUserStream && userVideo.current && callAccepted) userVideo.current.srcObject = otherUserStream;
    }, [otherUserStream, callAccepted])

    useEffect(() => {
        if (stream) {
            if (myVideo.current && callAccepted) myVideo.current.srcObject = stream;
            if (userToCall !== '') {
                const peer = new Peer({ initiator: true, trickle: false, stream });
                peer.on('signal', data => {
                    setCall({ from: me, name: callAcceptingUser, signal: data })
                    //We need to implement it with the concept of signup and login to set the other party name correctly
                    socket.emit('calluser', { userToCall: userToCall, signalData: data, from: me, name });
                });

                peer.on('stream', currentStream => {
                    setOtherUserStream(currentStream);
                })

                socket.on('callaccepted', data => {
                    setCallAcceptingUser(data.username);
                    setCallAccepted(true);
                    peer.signal(data?.signal);
                })
                connectionRef.current = peer;
            } else if (callAccepted && call.isReceivedCall) {
                //Here we are creating a Peer capable of video call.For this we need to set few paramters as follows: 
                const peer = new Peer({ initiator: false, trickle: false, stream });
                //Note here we have set 'initiator: false' as someone else has called us and we are answering his/her call with this function.
                //Also note that here setting trickle and stream is necessary for video and voice call. 
                //Here value of stream is state variable which we had set using setStream() function inside useEffect section. 

                //Like socket io peer also can have several events.
                peer.on('signal', data => {
                    let username = name && name != '' ? name : 'Other User'
                    socket.emit('answercall', { signal: data, to: call.from, username })
                });

                peer.on('stream', currentStream => {
                    setOtherUserStream(currentStream);
                })

                peer.signal(call.signal);

                connectionRef.current = peer;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stream, userToCall, callAccepted])


    const answerCall = () => {
        //To take permission from user to use his/her microphone and webcam for video and audio. 
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(currentStream => {
                setStream(currentStream);
            })
            .catch(e => {
                console.log("Error in getting permission in answering call", e);
            })
        setCallAccepted(true);
    }

    const callUser = (id) => {
        //To take permission from user to use his/her microphone and webcam for video and audio. 
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(currentStream => {
                setStream(currentStream);
            })
            .catch(e => {
                console.log("Error in getting permission in making call", e);
            })
        setUserToCall(id);
    }

    const leaveCall = () => {
        setCallEnded(true);
        connectionRef.current.destroy();
        window.location.reload();
    }

    return (<SocketContext.Provider value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        otherUserStream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
    }}>{children}</SocketContext.Provider>);
}

export { ContextProvider, SocketContext };