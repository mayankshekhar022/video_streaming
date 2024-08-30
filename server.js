// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/video-streaming-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: String,
  roomId: String
});

const User = mongoose.model('User', userSchema);

// WebSocket handling
wss.on('connection', ws => {
  ws.on('message', message => {
    const parsedMessage = JSON.parse(message);

    switch (parsedMessage.type) {
      case 'join':
        // Handle joining a room
        break;
      case 'offer':
        // Handle WebRTC offer
        break;
      case 'answer':
        // Handle WebRTC answer
        break;
      case 'candidate':
        // Handle WebRTC ICE candidate
        break;
    }
  });
});

// API endpoints
app.post('/create-room', (req, res) => {
  // Logic to create a room
  res.send({ success: true });
});

app.post('/join-room', async (req, res) => {
  const { username, roomId } = req.body;
  const user = new User({ username, roomId });
  await user.save();
  res.send({ success: true });
});

server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
