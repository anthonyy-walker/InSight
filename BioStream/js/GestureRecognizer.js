import {
    GestureRecognizer,
    FilesetResolver,
    DrawingUtils
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
  
  let gestureRecognizer;
  let video = document.getElementById("webcam");
  let canvas = document.getElementById("output_canvas");
  let canvasCtx = canvas.getContext("2d");
  
  export const initializeGestureRecognizer = async () => {
    console.log("Initializing Gesture Recognizer...");
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      
      gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO"
      });
      console.log("Gesture Recognizer initialized.");
    } catch (error) {
      console.error("Error initializing Gesture Recognizer:", error);
    }
  };
  
  export const predictGestures = async () => {
    if (!gestureRecognizer) {
      return;
    }
  
    const nowInMs = performance.now();
    const results = await gestureRecognizer.recognizeForVideo(video, nowInMs);
  
    // Clear the canvas before drawing landmarks and gestures
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  
    if (results && results.landmarks) {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const scaleX = canvas.width / videoWidth;
      const scaleY = canvas.height / videoHeight;
  
      // Draw landmarks and gesture recognition results
      results.landmarks.forEach((landmarks, index) => {
        const drawingUtils = new DrawingUtils(canvasCtx);
  
        // Draw connectors between landmarks (e.g., hand joints)
        drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5
        });
        
        // Draw landmarks for hand joints
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 2
        });
  
        // Get gesture information
        const gesture = results.gestures[index]?.[0];  // Assuming we're looking for the first gesture detected per hand
  
        if (gesture) {
          const categoryName = gesture.categoryName;
          const score = Math.round(gesture.score * 100);
  
          // Display gesture name and confidence above the first landmark (usually wrist)
          const firstLandmark = landmarks[0];
          const x = firstLandmark.x * canvas.width;
          const y = firstLandmark.y * canvas.height;
  
          canvasCtx.font = "14px Arial";
          canvasCtx.fillStyle = "yellow";
          canvasCtx.fillText(
            `${categoryName} (${score}%)`,
            x > 10 ? x - 10 : 10,  // Ensure label doesn't go off-screen
            y > 20 ? y - 20 : 20
          );
        }
      });
    }
  };
  