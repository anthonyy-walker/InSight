import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

let objectDetector;
let video = document.getElementById("webcam");
let canvas = document.getElementById("output_canvas");
let canvasCtx = canvas.getContext("2d");

// Initializing the object detector
export const initializeObjectDetector = async () => {
  console.log("Initializing Object Detector...");
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
    );
    
    objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      scoreThreshold: 0.7
    });
    console.log("Object Detector initialized.");
  } catch (error) {
    console.error("Error initializing object detector:", error);
  }
};

// Enables webcam
export const enableCam = async () => {
  const constraints = { video: true };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    predictWebcam();  
  } catch (error) {
    console.error("Error accessing webcam:", error);
    alert("Error accessing webcam.");
  }
};

// Predicts objects using the webcam
async function predictWebcam() {
  if (!objectDetector) {
    console.warn("Object Detector not initialized yet.");
    return;
  }

  const nowInMs = performance.now();
  const results = await objectDetector.detectForVideo(video, nowInMs);

  // Clear canvas and draw the bounding boxes
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  if (results && results.detections) {
    results.detections.forEach(detection => {
      // Draw the bounding box and label for each detection
      canvasCtx.beginPath();
      canvasCtx.rect(
        detection.boundingBox.originX,
        detection.boundingBox.originY,
        detection.boundingBox.width,
        detection.boundingBox.height
      );
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'green';
      canvasCtx.stroke();
      canvasCtx.font = "14px Arial";
      canvasCtx.fillStyle = 'red';
      canvasCtx.fillText(
        `${detection.categories[0].categoryName} (${Math.round(detection.categories[0].score * 100)}%)`,
        detection.boundingBox.originX,
        detection.boundingBox.originY > 10 ? detection.boundingBox.originY - 5 : 10
      );
    });
  }

  // Request the next frame for detection
  window.requestAnimationFrame(predictWebcam);
}
