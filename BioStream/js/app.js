import { initializeObjectDetector, enableCam } from './ObjectDetection.js';

window.onload = async function () {
  await initializeObjectDetector();
  enableCam(); // Start webcam
};
