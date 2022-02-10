import express from 'express';
import http from 'http';
import cors from 'cors';
import {Server} from 'socket.io';

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());

//Test API
app.get("/", (req, res) => {
    res.send("Video chat app server is working fine.");
});

/*
//Simple way to create and start an express server.
----------------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
}).on('error', (err) => console.log("Error in starting server : "+err));
----------------------------------------------------------------------------------
But here we will use a different method.Actuall this alternate method is mainly useful with https modules
(i.e for servers in which you need to transfer data over https).Here we will not use https module instead we will use http module.
But the method is very similar for both.In case of https server we will need few additional parameters.Example of https server:
----------------------------------------------------------------------------------
import https from 'https';
const privateKey  = fs.readFileSync('certificates/key.pem', 'utf8');
const certificate = fs.readFileSync('certificates/cert.pem', 'utf8');
const credentials = {key: privateKey, cert: certificate};
const server = https.createServer(credentials, app);
//Now you can start server as follows :
server.listen(5500);
----------------------------------------------------------------------------------
*/

const server = http.createServer(app);

// Creating a 'socket.io' server instance.
// Here 'Server' is imported from 'socket.io' module and 'server' is defined above.
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', socket => {
    console.log("Socket io connection establised.");

    //socket.emit is used if you want to emit some message or data to self(i.e user who created connection) on client side.
    socket.emit('me', socket.id);

    //socket.on is used if any message or data is sent from client side and you want to recieve that on server side.
    socket.on('disconnect', () => {
        //Socket.broadcast.emit is used if you want to broadcast data or message to every connected sockets(i.e users) except the sender.
        socket.broadcast.emit('call ended.');
    })

    //It will be called when we will call to some other user
    socket.on('calluser', data => {
        const {userToCall, signalData, from, name} = data;
        //"io.to(xyz).emit" is used if you want to emit some message or data to some other user(represented by variable 'userToCall' in this case).
        io.to(userToCall).emit('calluser', {signalData, from, name})
    })

    //It will be called when some other user will call you(i.e to the current user)
    socket.io('answercall', data => {
        const {to, signal} = data;
        //Here also we are using "io.to(xyz).emit" to emit some message or data to some other user particularly the user who called us(represented by variable 'to').  
        io.to(to).emit('callaccepted', signal);
    })
})

server.listen(PORT, () => {
    console.log(`App is running on port : ${PORT}`);
}).on('error', (err) => console.log("Error in starting server : "+err));