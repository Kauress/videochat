const roomId = window.location.pathname; //extract roomId from url
const socket = io.connect('/'); //make connection with socket server

const state = {
    peers: {},//contains users peer connection
    stream: null,
    rtcConfig: { //ICE server configuration to get network details
        'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }]
    }
}

//initialize stream before joining room
window.navigator.mediaDevices.getUserMedia({
    video: true
})
    .then(stream => {
        //store local stream
        state.stream = stream;
        //append stream on screen
        appendVideo("local", state.stream, true);
        //join room
        socket.emit('join', roomId);
    })
    .catch(err => {
        console.log('failed to initialize stream!', err.message);
    });


//establishing peer connection between user to enable video stream by exchanging network details

/**
 * step 1 -> send offer to new user
 */
socket.on('user-joined', async (userId) => {
    //create new connection for new user
    const peerConnection = new RTCPeerConnection(state.rtcConfig);

    //add local stream in user connection
    state.stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, state.stream);
    });

    //lister for ice server response after accepting answer
    peerConnection.addEventListener('icecandidate', function (event) {
        //send network details to new user
        socket.emit('ICE-Candidate', {
            receiver: userId,
            candidate: event.candidate
        });
    })

    //receive new user stream after establishing successful connection
    peerConnection.addEventListener('track', function (event) {
        //display new user stream on screen
        const [remoteStream] = event.streams;
        appendVideo(userId, remoteStream, false);
    });

    //create offer for new user
    const offer = await peerConnection.createOffer();
    //set offer in local connection
    peerConnection.setLocalDescription(offer);

    //store new user peer connection
    state.peers[userId] = { peerConnection };

    //send offer to new user
    socket.emit('call', { userId, offer });
});

/*
 * step 2 -> answer users call
*/
socket.on('call', async ({ caller, offer }) => {

    //create new connection for caller
    const peerConnection = new RTCPeerConnection(state.rtcConfig);

    //add local stream in caller connection
    state.stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, state.stream);
    });

    //lister for ice server response that respond after accepting offer
    peerConnection.addEventListener('icecandidate', function (event) {
        //send network details to caller
        socket.emit('ICE-Candidate', {
            receiver: caller,
            candidate: event.candidate
        });
    });

    //receive caller stream after establishing successful connection
    peerConnection.addEventListener('track', function (event) {
        //display caller stream on screen
        const [remoteStream] = event.streams;
        appendVideo(caller, remoteStream, false);
    });

    //set received offer in connection
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    //respond to caller offer
    const answer = await peerConnection.createAnswer();
    //set answer in connection 
    await peerConnection.setLocalDescription(answer);

    //store caller peer connection
    state.peers[caller] = { peerConnection };

    //send answer to caller
    socket.emit('answer', { caller, answer });
});

//receive responder answer and set response in connection
socket.on('answer', async ({ responder, answer }) => {
    //get responder connection
    const peerConnection = state.peers[responder].peerConnection;
    //set responder answer in connection
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

/**
 * step 3-> add exchanged network details (ICE-Candidate) in connection 
 */
socket.on('ICE-Candidate', async ({ sender, candidate }) => {
    if (!state.peers[sender]) return;

    //if connection already established return
    const peerConnection = state.peers[sender].peerConnection;

    await peerConnection.addIceCandidate(candidate);
});

//recieve message from other users in rooms
socket.on('message', (messageData) => insertMessage(messageData, false));

/**
 * close peer connection on user disconnect
 */
socket.on('user-disconnect', (userId) => {
    state.peers[userId].peerConnection.close();
    console.log(`User ${userId} disconnected!`);
    removeVideo(userId);
    delete state.peers[userId];
})

//handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault(); //prevent page from reloading

    //get message from form input
    const message = e.target.elements.message.value;
    //cancel message submission
    if (!message) return;

    //send message to other users in room
    const payload = {
        roomId,           //room id in which message is to be send
        message,          //main content of message
        time: Date.now()  //time of message send
    }
    socket.emit('message', payload);

    //display message in your chat box
    insertMessage({ message: payload.message, time: payload.time }, true);

    //clear form input
    e.target.elements.message.value = "";
    e.target.elements.message.focus();
});