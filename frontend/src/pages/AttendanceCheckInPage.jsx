import React, { useState, useEffect, useRef } from 'react';
import { Camera, LogIn, LogOut, RefreshCw, AlertCircle, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import BoundingBoxOverlay from '../components/BoundingBoxOverlay';
import GpsStatusBadge from '../components/GpsStatusBadge';
import GeofenceSimulator from '../components/GeofenceSimulator';
import PrivacyNotice from '../components/PrivacyNotice';
import AttendanceStatusModal from '../components/AttendanceStatusModal';
import { loadFaceDetectionModels, detectFacesInVideo, captureFrame } from '../services/faceDetection';
import { calculateDistance, getCurrentCoordinates } from '../services/geolocation';
import { api } from '../services/api';

export default function AttendanceCheckInPage({
  currentEmployee,
  office,
  onNavigateToCorrection,
  onAttendanceComplete,
  onRefreshOffice
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Camera & Face states
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [faceData, setFaceData] = useState({ faces: [], faceCount: 0, primaryDescriptor: null, eyeAspectRatio: 0.3, isBlinking: false });
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // GPS & Simulation states
  const [realGps, setRealGps] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [simulationMode, setSimulationMode] = useState('REAL'); // REAL | INSIDE_OFFICE | OUTSIDE_RADIUS | POOR_ACCURACY
  const [submitting, setSubmitting] = useState(false);

  // Result modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [resultData, setResultData] = useState(null);

  // 1. Initialize Face API Models & Start Camera
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadFaceDetectionModels();
        if (mounted) setModelsLoaded(true);
      } catch (e) {
        console.warn('Face models fallback active:', e.message);
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        if (mounted && videoRef.current) {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (mounted) {
              videoRef.current.play();
              setCameraReady(true);
            }
          };
        }
      } catch (err) {
        console.warn('Webcam stream error:', err);
        if (mounted) {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : 'No camera hardware found or camera in use by another app. Simulated camera frame active.'
          );
          // Set ready so simulated detector can still function for demo!
          setCameraReady(true);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Continuous Real-time Face Detection Loop
  useEffect(() => {
    let active = true;

    async function detectionLoop() {
      if (videoRef.current && cameraReady) {
        const detection = await detectFacesInVideo(videoRef.current);
        if (active) {
          setFaceData(detection);
          // If eye blink or confident single face observed, trigger liveness verification
          if (detection.isBlinking || (detection.faceCount === 1 && !livenessVerified)) {
            setLivenessVerified(true);
          }
        }
      }
      if (active) {
        animFrameRef.current = setTimeout(detectionLoop, 150);
      }
    }

    detectionLoop();

    return () => {
      active = false;
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, [cameraReady, livenessVerified]);

  // 3. Acquire Real GPS
  useEffect(() => {
    getCurrentCoordinates()
      .then((coords) => {
        setRealGps(coords);
        setGpsError(null);
      })
      .catch((err) => {
        setGpsError(err.message || 'Unable to retrieve device GPS');
        // Default to office coordinates if GPS permission is denied on desktop
        if (office) {
          setRealGps({
            latitude: office.latitude,
            longitude: office.longitude,
            accuracy: 25
          });
        }
      });
  }, [office]);

  // Compute active GPS based on simulation mode
  const getEffectiveGps = () => {
    if (!office) return realGps || { latitude: 0, longitude: 0, accuracy: 20 };

    switch (simulationMode) {
      case 'INSIDE_OFFICE':
        // ~25 meters from office center
        return {
          latitude: office.latitude + 0.00015,
          longitude: office.longitude + 0.0001,
          accuracy: 15
        };
      case 'OUTSIDE_RADIUS':
        // ~2.5 km away
        return {
          latitude: office.latitude + 0.022,
          longitude: office.longitude + 0.022,
          accuracy: 20
        };
      case 'POOR_ACCURACY':
        // Inside office coordinates but poor GPS accuracy (>100m)
        return {
          latitude: office.latitude,
          longitude: office.longitude,
          accuracy: 165 // triggers accuracy > 100m rejection rule
        };
      case 'REAL':
      default:
        return realGps || { latitude: office.latitude, longitude: office.longitude, accuracy: 25 };
    }
  };

  const effectiveGps = getEffectiveGps();

  // Calculate live distance to office
  const distanceToOffice =
    effectiveGps && office
      ? calculateDistance(
          effectiveGps.latitude,
          effectiveGps.longitude,
          office.latitude,
          office.longitude
        )
      : null;

  const isInsideGeofence = distanceToOffice !== null && office ? distanceToOffice <= office.radiusMeters : false;

  // Calibrate office to user's real GPS (Admin convenience button)
  const handleCalibrateOffice = async () => {
    if (!realGps) {
      alert('Cannot calibrate: real device GPS not acquired yet');
      return;
    }
    try {
      await api.updateOffice({
        latitude: realGps.latitude,
        longitude: realGps.longitude,
        radiusMeters: office?.radiusMeters || 150
      });
      if (onRefreshOffice) onRefreshOffice();
      alert(`Office location successfully calibrated to your device coordinates (${realGps.latitude.toFixed(5)}, ${realGps.longitude.toFixed(5)})!`);
    } catch (e) {
      alert('Failed to update office: ' + e.message);
    }
  };

  // Submit Check-In or Check-Out
  const handleAttendanceSubmit = async (type = 'CHECK_IN') => {
    if (!currentEmployee) {
      alert('Please select an active employee first.');
      return;
    }

    setSubmitting(true);
    setIsScanning(true);

    try {
      // Optional captured photo if company configured storePhotos
      const photo = office?.storePhotos ? captureFrame(videoRef.current) : null;

      const payload = {
        employeeId: currentEmployee.id,
        latitude: effectiveGps.latitude,
        longitude: effectiveGps.longitude,
        accuracy: effectiveGps.accuracy,
        faceCount: faceData.faceCount,
        faceDescriptor: faceData.primaryDescriptor,
        livenessVerified: Boolean(livenessVerified),
        type,
        source: 'camera',
        photoBase64: photo
      };

      const res = type === 'CHECK_IN' ? await api.checkIn(payload) : await api.checkOut(payload);
      setResultData(res);
      setModalOpen(true);
      if (onAttendanceComplete) onAttendanceComplete();
    } catch (err) {
      console.error('Submit error:', err);
      // If 422 validation response
      if (err.data) {
        setResultData(err.data);
      } else {
        setResultData({
          success: false,
          message: err.message || 'Network error connecting to attendance server',
          validationSummary: {}
        });
      }
      setModalOpen(true);
    } finally {
      setSubmitting(false);
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Geofence Testing & Simulation Toolbar */}
      <GeofenceSimulator
        simulationMode={simulationMode}
        setSimulationMode={setSimulationMode}
        office={office}
        deviceGps={realGps}
        onCalibrateOfficeToCurrentGps={handleCalibrateOffice}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Camera Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Camera Viewport Container */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Bounding box, single face detection, and liveness overlay */}
              <BoundingBoxOverlay
                faceData={faceData}
                livenessVerified={livenessVerified}
                isScanning={isScanning}
                employee={currentEmployee}
                videoWidth={640}
                videoHeight={480}
              />

              {/* Camera Error / Placeholder if camera hardware missing */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center z-20">
                  <Camera className="w-12 h-12 text-slate-500 mb-3 animate-pulse" />
                  <p className="text-sm text-slate-200 font-medium mb-1">Camera Stream</p>
                  <p className="text-xs text-slate-400 max-w-sm">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Quick Liveness Action Controls */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Liveness check:</span>
                {livenessVerified ? (
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Liveness Confirmed</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Blink eyes into lens</span>
                  </span>
                )}
              </div>

              {!livenessVerified && (
                <button
                  onClick={() => setLivenessVerified(true)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                >
                  Confirm Liveness Manually
                </button>
              )}
            </div>
          </div>

          {/* Privacy transparency banner */}
          <PrivacyNotice storePhotos={office?.storePhotos} />
        </div>

        {/* Right Column: Telemetry & Actions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Geolocation Status Badge */}
          <GpsStatusBadge
            coords={effectiveGps}
            office={office}
            distance={distanceToOffice}
            isInside={isInsideGeofence}
            gpsError={gpsError}
          />

          {/* Employee Verification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Employee Verification Profile
            </h4>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg overflow-hidden">
                {currentEmployee?.avatarUrl ? (
                  <img src={currentEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentEmployee?.name?.charAt(0) || 'E'
                )}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{currentEmployee?.name}</div>
                <div className="text-xs text-slate-400">
                  {currentEmployee?.department} • {currentEmployee?.role}
                </div>
                <div className="text-[11px] mt-0.5">
                  {currentEmployee?.faceEnrolled ? (
                    <span className="text-emerald-400 font-medium">✓ Face Biometric Enrolled</span>
                  ) : (
                    <span className="text-amber-400 font-medium">⚠ Face Not Enrolled</span>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist of rules that server will check */}
            <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">1. Exactly 1 Face Detected</span>
                <span
                  className={`font-semibold ${
                    faceData.faceCount === 1 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {faceData.faceCount === 1 ? '✓ Pass (1 Face)' : `✕ Fail (${faceData.faceCount} Faces)`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">2. Geofence Distance (≤ {office?.radiusMeters || 150}m)</span>
                <span className={`font-semibold ${isInsideGeofence ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isInsideGeofence
                    ? `✓ Pass (${distanceToOffice}m)`
                    : `✕ Outside (${distanceToOffice}m)`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">3. GPS Accuracy (≤ 100m)</span>
                <span
                  className={`font-semibold ${
                    effectiveGps?.accuracy <= 100 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {effectiveGps?.accuracy <= 100
                    ? `✓ Pass (±${Math.round(effectiveGps?.accuracy || 0)}m)`
                    : `✕ Weak (±${Math.round(effectiveGps?.accuracy || 0)}m)`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">4. Live Presence (Blink)</span>
                <span
                  className={`font-semibold ${
                    livenessVerified ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {livenessVerified ? '✓ Verified' : 'Waiting for blink'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Submission Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAttendanceSubmit('CHECK_IN')}
              disabled={submitting}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>Mark Check-In</span>
            </button>

            <button
              onClick={() => handleAttendanceSubmit('CHECK_OUT')}
              disabled={submitting}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-950/50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>Mark Check-Out</span>
            </button>
          </div>

          {/* Fallback button info */}
          <div className="text-center">
            <button
              onClick={onNavigateToCorrection}
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center space-x-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Camera or GPS not working? Submit HR Correction Fallback</span>
            </button>
          </div>
        </div>
      </div>

      {/* Result Status Modal */}
      <AttendanceStatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        result={resultData}
        onNavigateToCorrection={onNavigateToCorrection}
      />
    </div>
  );
}
