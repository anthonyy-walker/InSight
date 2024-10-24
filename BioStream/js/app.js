import { initializeObjectDetector, predictObjects } from './ObjectDetection.js';
import { initializeFaceDetector, predictFaces } from './FaceDetection.js';
import { initializeGestureRecognizer, predictGestures } from './GestureRecognizer.js';

let video = document.getElementById('webcam');
let canvas = document.getElementById('output_canvas');
let canvasCtx = canvas.getContext('2d');

// Function to enable the webcam
const enableCam = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();

    video.addEventListener('loadeddata', () => {
      // Set the canvas size equal to the video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Start detection once the video has loaded
      detectAll();
    });
  } catch (error) {
    console.error("Error accessing webcam:", error);
    alert("Error accessing webcam.");
  }
};

// Function to handle object, face, and gesture detection
const detectAll = async () => {
  // Clear the canvas before drawing new detections
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Perform object detection
  await predictObjects();

  // Perform face detection
  await predictFaces();

  // Perform gesture recognition
  //await predictGestures();

  // Keep detecting in the next animation frame
  window.requestAnimationFrame(detectAll);
};

// Initialize detectors and start the webcam automatically on page load
window.onload = async () => {
  await initializeObjectDetector();  // Initialize Object Detection
  await initializeFaceDetector();    // Initialize Face Detection
  await initializeGestureRecognizer();  // Initialize Gesture Recognition
  enableCam();  // Enable webcam
};
