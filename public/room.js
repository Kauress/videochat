const form = document.getElementById("message-form");
const messages = document.getElementById("message-container");
const videoContainer = document.querySelector('.videos');

//insert message in message container [moved from socket.js]
function insertMessage(data, owner) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('msg-wrapper');
    if (owner) wrapper.classList.add('owner'); //add owner class to align message right side

    const msg = document.createElement('span');
    msg.classList.add('message');
    msg.innerText = data.message;
    wrapper.appendChild(msg);

    const time = document.createElement('span');
    time.classList.add('time');
    //append time in 24hour format with only hour and minte
    time.innerText = new Date(data.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    wrapper.appendChild(time)

    messages.appendChild(wrapper);
    //scroll top to see latest message
    messages.scrollTop = messages.scrollHeight;
}

//append user stream in video container
function appendVideo(id, videoStream, muted) {
    const video = document.createElement('video');
    video.id = id; //set the user id as id of element
    video.srcObject = videoStream; //user stream
    video.muted = muted; //mute the current user audio to prevent echo
    video.play();
    videoContainer.appendChild(video);
}

//remove video stream from screen
function removeVideo(id) {
    const video = document.getElementById(id);
    video.srcObject = null;
    video.remove();
}