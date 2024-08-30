import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';

function App() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [inCall, setInCall] = useState(false);
  const socket = useRef(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(new RTCPeerConnection());

  const handleCreateRoom = async () => {
    const response = await fetch('http://localhost:5000/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId, username })
    });
    const data = await response.json();
    if (response.ok) {
      setInCall(true);
      initializeConnection();
    } else {
      console.log(data.error);
    }
  };

  const handleJoinRoom = async () => {
    const response = await fetch('http://localhost:5000/join-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId, username })
    });
    const data = await response.json();
    if (response.ok) {
      setInCall(true);
      initializeConnection();
    } else {
      console.log(data.error);
    }
  };

  const initializeConnection = () => {
    socket.current = new WebSocket('ws://localhost:5000');
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));
      });

    peerConnectionRef.current.ontrack = event => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnectionRef.current.onicecandidate = event => {
      if (event.candidate) {
        socket.current.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
      }
    };

    socket.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      if (data.type === 'offer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.current.send(JSON.stringify({ type: 'answer', answer }));
      }

      if (data.type === 'answer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      if (data.type === 'ice-candidate') {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    };

    if (inCall) {
      peerConnectionRef.current.createOffer().then(offer => {
        peerConnectionRef.current.setLocalDescription(offer);
        socket.current.send(JSON.stringify({ type: 'offer', offer }));
      });
    }
  };

  useEffect(() => {
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  return (
    <div className="container">
      {!inCall ? (
        <>
          <h1>Video Streaming App</h1>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleCreateRoom}>Create Room</button>
          <button onClick={handleJoinRoom}>Join Room</button>
        </>
      ) : (
        <div className="video-container">
          <video ref={localVideoRef} autoPlay muted />
          <video ref={remoteVideoRef} autoPlay />
        </div>
      )}
    </div>
  );
}

export default App;
