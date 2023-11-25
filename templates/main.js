const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const chatbox = document.getElementById('chatbox');
let localStream, remoteStream;
let peerConnection;

async function startVideoChat() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        // Set up WebRTC peer connection
        peerConnection = new RTCPeerConnection();
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        // Set up event handlers for the peer connection
        peerConnection.onicecandidate = handleICECandidateEvent;
        peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
        peerConnection.ontrack = handleTrackEvent;

        // Create an offer to send to the remote peer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // In a real application, you would send the offer to the remote peer (via signaling server)
        // and get the answer back. For simplicity, we'll skip the signaling server in this example.

        // For testing purposes, simulate receiving the offer on the remote peer
        handleOffer(offer);

    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
}

function handleICECandidateEvent(event) {
    if (event.candidate) {
        // In a real application, you would send the candidate to the remote peer
        // (via signaling server). For simplicity, we'll skip this step in this example.
        console.log('ICE candidate:', event.candidate);
    }
}

function handleICEConnectionStateChangeEvent(event) {
    console.log('ICE connection state change:', peerConnection.iceConnectionState);

    if (peerConnection.iceConnectionState === 'disconnected') {
        hangUp();
    }
}

function handleTrackEvent(event) {
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}

// Simulate receiving the offer on the remote peer
function handleOffer(offer) {
    // Set up the remote peer connection
    peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = handleICECandidateEvent;
    peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    peerConnection.ontrack = handleTrackEvent;

    // Add the local stream to the remote peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set the remote description
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Create an answer to send back to the remote peer
    peerConnection.createAnswer()
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
            // In a real application, you would send the answer to the remote peer
            // (via signaling server). For simplicity, we'll skip this step in this example.
            console.log('Sending answer:', peerConnection.localDescription);

            // For testing purposes, simulate receiving the answer on the local peer
            handleAnswer(peerConnection.localDescription);
        })
        .catch(error => console.error('Error creating answer:', error));
}

// Simulate receiving the answer on the local peer
function handleAnswer(answer) {
    // Set the remote peer connection's remote description
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function hangUp() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

function sendMessage() {
    const messageInput = document.getElementById("messageInput");

    if (messageInput.value.trim() !== "") {
        const message = document.createElement("p");
        message.textContent = "You: " + messageInput.value;
        chatbox.appendChild(message);
        messageInput.value = "";
    }
}
