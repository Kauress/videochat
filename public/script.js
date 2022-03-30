/*display room link details*/
function displayRoomLink(roomId) {
    //get element to insert room link
    const linkEl = document.getElementById('room-link');

    const span = document.createElement('span');
    const a = document.createElement('a');

    /**
     * Add room Id with website link to create room link
     * eg. https://chatapp.com + / + roomId -> https://chatapp.com/roomId
     */
    const link = window.location.origin + "/" + roomId;

    span.innerText = link;
    span.style.marginRight = "50px"; //add margin on right side of span

    a.href = link;
    a.innerText = "Join";

    linkEl.appendChild(span);
    linkEl.appendChild(a);
}

/**create a roomId and display room link to user*/
async function createRoom() {
    //send request to server to create a new room Id
    const response = await fetch('/create-room', { method: "GET" });
    //get result from server response
    const res = await response.json();

    //check result status
    if (res.status === "fail") {
        //if status failed then show error message to user
        alert("failed to create room id");
    } else {
        //display room link to user
        displayRoomLink(res.data.roomId);
    }
}