import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

let faceDetector;
let video = document.getElementById("webcam");
let canvas = document.getElementById("output_canvas");
let canvasCtx = canvas.getContext("2d");

// Initialize the face detector
export const initializeFaceDetector = async () => {
  console.log("Initializing Face Detector...");
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU"
      },
      runningMode: "VIDEO"
    });
    console.log("Face Detector initialized.");
  } catch (error) {
    console.error("Error initializing face detector:", error);
  }
};

// Predict faces and handle multiple faces at a time
export const predictFaces = async () => {
  if (!faceDetector) {
    console.warn("Face Detector not initialized yet.");
    return;
  }

  const nowInMs = performance.now();
  const results = await faceDetector.detectForVideo(video, nowInMs);

  if (results && results.detections.length > 0) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    // Clear previous bounding boxes
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through each detected face and draw the bounding box and confidence label
    results.detections.forEach((detection, index) => {
      const x = detection.boundingBox.originX * scaleX;
      const y = detection.boundingBox.originY * scaleY;
      const width = detection.boundingBox.width * scaleX;
      const height = detection.boundingBox.height * scaleY;

      // Draw the bounding box for the face
      canvasCtx.beginPath();
      canvasCtx.rect(x, y, width, height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'blue';  // Blue for face bounding boxes
      canvasCtx.stroke();

      // Add the confidence label above the bounding box
      const confidence = Math.round(detection.categories[0].score * 100);
      canvasCtx.font = "14px Arial";
      canvasCtx.fillStyle = 'yellow';  // Yellow for face labels
      canvasCtx.fillText(`Face ${index + 1}: ${confidence}%`, x, y > 10 ? y - 5 : 10);
    });
  }
};
