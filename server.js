const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (data) => {
        try {
            // Attempt to parse message as JSON
            const parsedData = JSON.parse(data);

            if (parsedData.type === 'mesh') {
                // Decode base64 content if needed
                const meshContent = Buffer.from(parsedData.content, 'base64').toString('utf8');
                
                // Ensure each line in mesh content has the correct format
                const formattedMeshContent = meshContent
                    .split('\n')
                    .map(line => line.startsWith('v ') ? line.trim() : '')
                    .join('\n');

                // Append to OBJ file with line breaks
                fs.appendFileSync('scene_mesh.obj', formattedMeshContent + '\n');
                console.log("Mesh data saved");

            } else if (parsedData.type === 'video') {
                const videoContent = Buffer.from(parsedData.content, 'base64');
                fs.appendFileSync('video_stream.raw', videoContent, 'binary');
                console.log("Video data saved");

            } else if (parsedData.type === 'audio') {
                const audioContent = Buffer.from(parsedData.content, 'base64');
                fs.appendFileSync('audio_stream.raw', audioContent, 'binary');
                console.log("Audio data saved");

            } else if (parsedData.type === 'connection') {
                console.log(parsedData.content); // Handle connection message
            }
        } catch (error) {
            console.error("Received non-JSON message or failed to parse:", data.toString());
            console.error("Error details:", error.message);
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server is running on ws://localhost:8080');
