import React, { useState, createContext, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('http://localhost:5000');

const ContextProvider = ({ children }) => {
    const [stream, setStream] = useState(null);
    const [me, setMe] = useState('');
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        //To take permission from user to use his/her microphone and webcam for video and audio. 
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(currentStream => {
                setStream(currentStream);

                //Here not only we are setting the current stream to the state but also to the 'ref' which we will 
                //use to populate in the video iframe. 
                myVideo.current.srcObject = currentStream;
            })

        socket.on('me', id => {
            setMe(id);
        });

        socket.on('calluser', ({ from, name: callerName, signal }) => {
            setCall({ isReceivedCall: true, from, name: callerName, signal });
        });
    }, []);

    const answerCall = () => {
        setCallAccepted(true);

        //Here we are creating a Peer capable of video call.For this we need to set few paramters as follows: 
        const peer = new Peer({ initiator: false, trickle: false, stream });
        //Note here we have set 'initiator: false' as someone else has called us and we are answering his/her call with this function.
        //Also note that here setting trickle and stream is necessary for video and voice call. 
        //Here value of stream is state variable which we had set using setStream() function inside useEffect section. 

        //Like socket io peer also can have several events.
        peer.on('signal', data => {
            socket.emit('answercall', { signal: data, to: call.from })
        });

        peer.on('stream', currentStream => {
            userVideo.current.srcObject = currentStream;
            //Note :- Here we are not setting our video reference.We had already did that in useEffect.
            //Here we are doing it for the other user who have joined for call.  
        })

        peer.signal(call.signal);

        connectionRef.current = peer;
    }

    const callUser = (id) => {
        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on('signal', data => {
            socket.emit('calluser', { userToCall: id, signalData: data, from: me, name });
        });

        peer.on('stream', currentStream => {
            userVideo.current.srcObject = currentStream;
        })

        socket.on('callaccepted', signal => {
            setCallAccepted(true);

            peer.signal(signal);
        })

        connectionRef.current = peer;

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