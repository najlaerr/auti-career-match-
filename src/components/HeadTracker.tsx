import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Loader2, Camera, CameraOff } from 'lucide-react';

interface HeadTrackerProps {
  onNod: () => void; // Yes
  onShake: () => void; // No
  isActive: boolean;
}

export default function HeadTracker({ onNod, onShake, isActive }: HeadTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  
  // Gesture tracking state
  const historyRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const lastGestureTimeRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: false,
          runningMode: 'VIDEO',
          numFaces: 1
        });
        
        if (active) {
          landmarkerRef.current = landmarker;
          setIsModelLoaded(true);
        }
      } catch (error) {
        console.error("Error loading FaceLandmarker:", error);
      }
    };

    initModel();

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !isModelLoaded) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setHasCameraPermission(true);
            predictWebcam();
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setHasCameraPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive, isModelLoaded]);

  const predictWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || !isActive) return;

    const startTimeMs = performance.now();
    
    if (video.currentTime > 0) {
      const results = landmarker.detectForVideo(video, startTimeMs);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          
          // Draw a simple mesh or just the nose
          const nose = landmarks[1];
          ctx.fillStyle = '#0d9488'; // teal-600
          ctx.beginPath();
          ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Gesture Detection Logic
          const now = Date.now();
          // Cooldown of 1.5 seconds between gestures
          if (now - lastGestureTimeRef.current > 1500) {
            historyRef.current.push({ x: nose.x, y: nose.y, time: now });
            
            // Keep only last 1 second of history
            historyRef.current = historyRef.current.filter(p => now - p.time < 1000);
            
            if (historyRef.current.length > 10) {
              const xs = historyRef.current.map(p => p.x);
              const ys = historyRef.current.map(p => p.y);
              
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              
              const rangeX = maxX - minX;
              const rangeY = maxY - minY;
              
              // Thresholds for movement (relative to video width/height)
              const SHAKE_THRESHOLD = 0.08;
              const NOD_THRESHOLD = 0.08;
              
              if (rangeX > SHAKE_THRESHOLD && rangeY < rangeX * 0.6) {
                // Detected Shake (No)
                onShake();
                lastGestureTimeRef.current = now;
                historyRef.current = [];
              } else if (rangeY > NOD_THRESHOLD && rangeX < rangeY * 0.6) {
                // Detected Nod (Yes)
                onNod();
                lastGestureTimeRef.current = now;
                historyRef.current = [];
              }
            }
          }
        }
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  if (!isActive) return null;

  return (
    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-teal-200 shadow-lg bg-slate-100 flex items-center justify-center">
      {!isModelLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin mb-1" />
          <span className="text-[10px] font-bold text-teal-700">Loading AI...</span>
        </div>
      )}
      {hasCameraPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50 z-10 text-rose-500">
          <CameraOff className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold text-center px-2">Camera Blocked</span>
        </div>
      )}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-20"
        width={320}
        height={240}
      />
      
      {/* Overlay Instructions */}
      {isModelLoaded && hasCameraPermission && (
        <div className="absolute bottom-2 left-0 right-0 text-center z-30 pointer-events-none">
          <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
            Nod = Yes | Shake = No
          </span>
        </div>
      )}
    </div>
  );
}
