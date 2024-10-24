import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

let objectDetector;
let video = document.getElementById("webcam");
let canvas = document.getElementById("output_canvas");
let canvasCtx = canvas.getContext("2d");

export const initializeObjectDetector = async () => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
    );
    
    objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float32/1/efficientdet_lite2.tflite`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      scoreThreshold: 0.2,
    });
    console.log("Object Detector initialized.");
  } catch (error) {
    console.error("Error initializing object detector:", error);
  }
};

export const predictObjects = async () => {
  if (!objectDetector) {
    return;
  }

  const nowInMs = performance.now();
  const results = await objectDetector.detectForVideo(video, nowInMs);

  if (results && results.detections) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    results.detections.forEach(detection => {
      const x = detection.boundingBox.originX * scaleX;
      const y = detection.boundingBox.originY * scaleY;
      const width = detection.boundingBox.width * scaleX;
      const height = detection.boundingBox.height * scaleY;

      // Draw the bounding box for object detection
      canvasCtx.beginPath();
      canvasCtx.rect(x, y, width, height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'green';  // Green for objects
      canvasCtx.stroke();
      canvasCtx.font = "14px Arial";
      canvasCtx.fillStyle = 'red';  // Red for object labels
      canvasCtx.fillText(
        `${detection.categories[0].categoryName} (${Math.round(detection.categories[0].score * 100)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );
    });
  }
};
