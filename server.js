const express = require('express');
const app = express();
//configure socket with http server
const http = require("http");
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);

const path = require('path');
const uuid = require('uuid');

/**
 * Only send file from public folder to user 
 */
app.use('/public', express.static('public'));

/**
 * send home page to user
 */
app.get('/', (req, res) => {
    //join home page file path with main directory path
    const filePath = path.join(__dirname, './public/index.html');
    //send file to user
    return res.sendFile(filePath);
});

/**
 * create unique room Id
 */
app.get('/create-room', (req, res) => {
    try {
        const roomId = uuid.v4(); //generate unique roomId 
        //send room Id to user
        return res.status(200).json({ status: "success", data: { roomId } });
    } catch (err) {
        //send err message to user if any error occured
        res.status(400).json({ status: "fail", message: err.message });
    }
});

/**
 * send meeting room page to user
 */
app.get('/:roomId', (req, res) => {
    //check room Id is valid or not
    const isValid = uuid.validate(req.params.roomId);

    //send error message to user if room id is invalid
    if (!isValid) {
        return res.status(400).json({ status: "fail", message: "Invalid room Id" });
    }

    //join home page file path with main directory path
    const filePath = path.join(__dirname, './public/room.html');
    //send room page to user if room id is valid
    return res.sendFile(filePath);
});


//Socket: listen for new connection
io.on("connection", (socket) => {

    console.log("New user connected!"); //Log message when new user connected to socket

    /*add new connected user in room*/
    socket.on("join", (roomId) => {
        //add user in room
        socket.join(roomId);
        //inform users in room on new user connection
        socket.to(roomId).emit('user-joined', socket.id);
        //inform users in room on user disconnect
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnect', socket.id);
        });
    });

    /*send offer to new user*/
    socket.on('call', ({ userId, offer }) => {
        socket.to(userId).emit("call", { caller: socket.id, offer });
    });

    /*receive call respone from new user*/
    socket.on('answer', ({ caller, answer }) => {
        //send response to caller
        socket.to(caller).emit("answer", { responder: socket.id, answer });
    })

    /*exchange ICE-candidate between users*/
    //ICE-candidate contains network information of users
    socket.on('ICE-Candidate', ({ receiver, candidate }) => {
        //send ICECandidate to user
        socket.to(receiver).emit("ICE-Candidate", {
            sender: socket.id,
            candidate
        });
    });

    /*recieve message*/
    socket.on("message", ({ roomId, message, time }) => {
        //send messages to other users in room
        socket.to(roomId).emit('message', { message, time });
    });
});

//Start app on port 3000
server.listen(3000, console.log(`Up And Running On Port 3000`));