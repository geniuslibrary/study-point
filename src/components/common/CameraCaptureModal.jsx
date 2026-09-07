import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RotateCcw, Check, RefreshCw, AlertCircle, Smartphone } from 'lucide-react';
import { compressImageFile } from '../../utils/helpers';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [loadingCamera, setLoadingCamera] = useState(false);
  const videoRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Start video stream when modal opens or facingMode changes
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCameraStream();

    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCameraStream = async () => {
    stopCameraStream();
    setCameraError(null);
    setLoadingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported on this browser/device. Please use native camera upload.');
      setLoadingCamera(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('getUserMedia error:', err);
      // Try fallback without explicit facingMode constraint if first attempt failed
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error('Camera access failed:', fallbackErr);
        setCameraError(
          'कैमरा शुरू नहीं हो पाया। कृपया कैमरा परमिशन दें या नीचे दिए "Native Camera" बटन का उपयोग करें।'
        );
      }
    } finally {
      setLoadingCamera(false);
    }
  };

  // Switch between front & back camera
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Snap photo from live video frame with center square crop
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    // Center square crop
    const size = Math.min(videoWidth, videoHeight);
    const startX = Math.round((videoWidth - size) / 2);
    const startY = Math.round((videoHeight - size) / 2);

    const canvas = document.createElement('canvas');
    const targetDim = 480; // Sharp square photo
    canvas.width = targetDim;
    canvas.height = targetDim;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Mirror user-facing camera for natural preview
    if (facingMode === 'user') {
      ctx.translate(targetDim, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, targetDim, targetDim);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    setCapturedImage(dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCameraStream();
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  // Fallback direct mobile camera input handler with compressImageFile
  const handleNativeCameraChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 480, 0.86);
      onCapture(compressed);
      handleClose();
    } catch (err) {
      console.error('Camera compression error:', err);
      alert('फोटो प्रोसेस नहीं हो सकी। कृपया दोबारा कोशिश करें।');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div className="relative bg-slate-900 text-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Capture Student Photo</h3>
              <p className="text-[11px] text-slate-400">सीधे कैमरे से फोटो लें</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Capture Area */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Snapped Photo Preview */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage}
                alt="Captured Student"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Photo Captured
              </div>
            </div>
          ) : cameraError ? (
            /* Error & Fallback View */
            <div className="p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-indigo-600/30"
              >
                <Smartphone className="w-4 h-4" /> Open Phone Camera App (सिस्टम कैमरा)
              </button>
            </div>
          ) : (
            /* Live Camera Stream View */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => videoRef.current?.play()}
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-60 h-60 rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    चेहरा यहाँ रखें (Face inside circle)
                  </span>
                </div>
              </div>

              {/* Switch Camera Button (Front/Back) */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                title="Switch Camera"
                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-full backdrop-blur-xs border border-white/20 transition cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Loading Indicator */}
          {loadingCamera && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800/80">
          {capturedImage ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <RotateCcw className="w-4 h-4" /> Retake (दोबारा लें)
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Use Photo (यह लगाएं)
              </button>
            </div>
          ) : !cameraError ? (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleSnap}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 p-1.5 flex items-center justify-center cursor-pointer transition shadow-lg ring-4 ring-indigo-500/50 active:scale-95"
              >
                <div className="w-full h-full rounded-full border-2 border-slate-900 bg-white" />
              </button>
              <div className="flex items-center justify-between w-full px-2">
                <span className="text-[11px] text-slate-400">टैप करके तस्वीर खींचें</span>
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Smartphone className="w-3 h-3" /> Native App
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Hidden Fallback Native Input */}
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
