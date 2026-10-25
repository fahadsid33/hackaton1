import React, { useState, useRef, useEffect } from 'react';
import { Camera, UserCheck, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Shield } from 'lucide-react';
import { loadFaceDetectionModels, detectFacesInVideo, captureFrame } from '../services/faceDetection';
import { api } from '../services/api';

export default function EmployeeEnrollPage({ currentEmployee, onEmployeeUpdated }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [faceData, setFaceData] = useState({ faces: [], faceCount: 0, primaryDescriptor: null });
  const [enrolling, setEnrolling] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  useEffect(() => {
    let mounted = true;
    let animId = null;

    async function startCamera() {
      await loadFaceDetectionModels();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        if (mounted && videoRef.current) {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current.play();
        }
      } catch (err) {
        console.warn('Camera stream error:', err);
      }
    }

    startCamera();

    async function scan() {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const result = await detectFacesInVideo(videoRef.current);
        if (mounted) setFaceData(result);
      }
      if (mounted) animId = setTimeout(scan, 200);
    }

    scan();

    return () => {
      mounted = false;
      if (animId) clearTimeout(animId);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleEnroll = async () => {
    if (!currentEmployee) return;

    if (faceData.faceCount !== 1) {
      setErrorMsg(`Cannot enroll: Exactly 1 face required (${faceData.faceCount} detected)`);
      return;
    }

    if (!faceData.primaryDescriptor || faceData.primaryDescriptor.length !== 128) {
      setErrorMsg('Could not extract valid 128-dimensional face descriptor. Please align face.');
      return;
    }

    setEnrolling(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const photo = captureFrame(videoRef.current);
      setCapturedPhoto(photo);

      const res = await api.enrollFace(currentEmployee.id, faceData.primaryDescriptor);
      setSuccessMsg(`Face biometrics successfully enrolled for ${currentEmployee.name}! 128-d descriptor vector registered.`);
      if (onEmployeeUpdated) onEmployeeUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to enroll face');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Employee Biometric Face Enrollment</h2>
            <p className="text-xs text-slate-400">
              Register 128-dimensional facial feature vector for identity verification during attendance
            </p>
          </div>
        </div>

        {/* Selected Employee Info */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 font-bold overflow-hidden">
              {currentEmployee?.avatarUrl ? (
                <img src={currentEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                currentEmployee?.name?.charAt(0) || 'E'
              )}
            </div>
            <div>
              <div className="font-semibold text-white">{currentEmployee?.name}</div>
              <div className="text-xs text-slate-400">
                {currentEmployee?.id} • {currentEmployee?.department} • {currentEmployee?.role}
              </div>
            </div>
          </div>

          <div>
            {currentEmployee?.faceEnrolled ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enrolled</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Not Enrolled</span>
              </span>
            )}
          </div>
        </div>

        {/* Camera Enrollment Viewport */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Target Oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-48 h-64 rounded-[45%] border-2 transition-all ${
                  faceData.faceCount === 1 ? 'border-emerald-500 shadow-[0_0_20px_#10b981]' : 'border-slate-500/50 border-dashed'
                }`}
              ></div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-xs bg-slate-950/70 p-2 rounded-lg backdrop-blur-sm">
              <span className="text-slate-300">Face Status:</span>
              <span
                className={`font-semibold ${
                  faceData.faceCount === 1 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {faceData.faceCount === 1 ? '1 Face Detected' : `${faceData.faceCount} Faces`}
              </span>
            </div>
          </div>

          {/* Instructions and Enrollment Action */}
          <div className="space-y-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2.5">
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Enrollment Guidelines</span>
              </div>
              <p>1. Center your face directly in the oval frame.</p>
              <p>2. Ensure good lighting and remove sunglasses or face coverings.</p>
              <p>3. Maintain a neutral expression while the system extracts the 128-d descriptor vector.</p>
              <p className="text-slate-500 text-[11px] pt-1">
                Biometric vector computation is executed client-side. The resulting mathematical descriptor is stored for verification.
              </p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleEnroll}
              disabled={enrolling || faceData.faceCount !== 1}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center space-x-2"
            >
              {enrolling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting Biometrics & Enrolling...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Capture & Enroll Face</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
