/**
 * Real-time Assembly Demo Page
 * Integrates all new real-time features: webcam detection, guided mode,
 * feedback overlay, enhanced 3D viewer, dashboard, and AR overlay
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Camera,
  CameraOff,
  Play,
  Square,
  RotateCcw,
  Maximize2,
  Users,
  Trophy,
} from "lucide-react";

// Import all our new components
import GuidedMode from "../components/GuidedMode";
import FeedbackOverlay from "../components/FeedbackOverlay";
import ToyAssembly3D from "../components/3d/ToyAssembly3D";
import Dashboard from "../components/Dashboard";
import AROverlay from "../components/AROverlay";

// Import API functions
import {
  detectToyParts,
  validateStep,
  startAssemblySession,
  completeAssemblySession,
  getAssemblySteps,
} from "../services/api";

const RealTimeAssemblyDemo = () => {
  const navigate = useNavigate();

  // Webcam State
  const [webcamActive, setWebcamActive] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  // Assembly Session State
  const [sessionId, setSessionId] = useState(null);
  const [assemblySteps, setAssemblySteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);

  // Detection State
  const [currentDetection, setCurrentDetection] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [realTimeState, setRealTimeState] = useState(null);

  // UI State
  const [viewMode, setViewMode] = useState("guided"); // 'guided' | '3d' | 'dashboard'

  // Initialize assembly session
  useEffect(() => {
    const initSession = async () => {
      try {
        const steps = await getAssemblySteps("demo_set");
        setAssemblySteps(steps.steps);

        const session = await startAssemblySession("demo_set", "Demo User");
        setSessionId(session.sessionId);
        setSessionActive(true);

        toast.success("🎯 Assembly session started!");
      } catch (error) {
        console.error("Failed to initialize session:", error);
        toast.error("Failed to start assembly session");
      }
    };

    initSession();
  }, []);

  // Webcam Functions
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
        toast.success("📸 Webcam started!");
      }
    } catch (error) {
      toast.error("Camera access failed. Please allow permissions.");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setDetectionActive(false);
    clearInterval(detectionIntervalRef.current);
    setCurrentDetection(null);
    setRealTimeState(null);
    toast("📸 Webcam stopped");
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const toggleDetection = async () => {
    if (detectionActive) {
      clearInterval(detectionIntervalRef.current);
      setDetectionActive(false);
      setRealTimeState({ status: "scanning" });
    } else {
      setDetectionActive(true);

      detectionIntervalRef.current = setInterval(async () => {
        await performDetection();
      }, 1500);
    }
  };

  const performDetection = async () => {
    const frameData = captureFrame();
    if (!frameData || !assemblySteps.length) return;

    try {
      // Convert base64 to blob for API
      const response = await fetch(frameData);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("images", blob, "webcam-frame.jpg");

      const result = await detectToyParts(formData);
      const detectedPieces = result.detections || [];

      const currentStepData = assemblySteps[currentStep];
      let detectionStatus = "scanning";
      let detectedPiece = null;
      let confidence = 0;

      if (detectedPieces.length > 0) {
        const bestDetection = detectedPieces[0];
        detectedPiece = bestDetection.class_name;
        confidence = bestDetection.confidence;

        // Validate against current step
        if (
          currentStepData &&
          detectedPiece.toLowerCase() ===
            currentStepData.required_piece.toLowerCase()
        ) {
          detectionStatus = "correct";

          // Validate with backend
          const validation = await validateStep(
            detectedPiece,
            currentStep,
            sessionId,
            confidence,
          );

          if (validation.correct) {
            toast.success(`✓ Correct! ${detectedPiece} detected`);
          }
        } else {
          detectionStatus = "wrong";
        }
      }

      // Update detection state
      const detection = {
        timestamp: Date.now(),
        pieces: detectedPieces,
        confidence,
        correct: detectionStatus === "correct",
        step: currentStep + 1,
        piece: detectedPiece,
      };

      setCurrentDetection(detection);
      setDetectionHistory((prev) => [detection, ...prev.slice(0, 19)]); // Keep last 20

      // Update real-time state for components
      setRealTimeState({
        status: detectionStatus,
        detectedPiece,
        expectedPieceType: currentStepData?.required_piece,
        confidence,
      });
    } catch (error) {
      console.error("Detection error:", error);
    }
  };

  const handleStepChange = (stepData, stepIndex) => {
    setCurrentStep(stepIndex);
    setRealTimeState((prev) => ({
      ...prev,
      expectedPieceType: stepData.required_piece,
    }));
  };

  const handleAssemblyComplete = async () => {
    try {
      if (sessionId) {
        await completeAssemblySession(sessionId);
      }
      setSessionActive(false);
      toast.success("🎉 Assembly completed!");
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  const resetAssembly = async () => {
    try {
      // Start new session
      const session = await startAssemblySession("demo_set", "Demo User");
      setSessionId(session.sessionId);
      setCurrentStep(0);
      setDetectionHistory([]);
      setSessionActive(true);
      toast("🔄 Assembly reset!");
    } catch (error) {
      console.error("Failed to reset assembly:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      clearInterval(detectionIntervalRef.current);
    };
  }, []);

  const safeTotalSteps = Math.max(assemblySteps.length, 1);
  const visibleSteps = assemblySteps.slice(0, 8);
  const attempts = detectionHistory.length;
  const correctAttempts = detectionHistory.filter((d) => d.correct).length;
  const accuracy =
    attempts > 0 ? Math.round((correctAttempts / attempts) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Fixed background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/last-section-bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -2,
        }}
      />
      {/* Fixed dark overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(13, 14, 26, 0.72)",
          backdropFilter: "blur(10px)",
          zIndex: -1,
        }}
      />

      {/* Scrollable content */}
      <div className="page-shell">
        <div className="page-shell__inner page-shell__inner--wide">
          {/* ── Header ───────────────────────────────────────────── */}
          <div className="page-header max-w-3xl">
            <p className="page-eyebrow">AI-Powered Assembly</p>
            <h1 className="page-title text-white">
              Real-time{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Assembly Assistant
              </span>
            </h1>
            <p className="page-description max-w-2xl mx-auto">
              Experience guided assembly with live webcam detection, AR-style
              overlays, and step-by-step 3D visualization.
            </p>
          </div>

          {/* ── View Mode Tabs ────────────────────────────────────── */}
          <div className="flex justify-center mb-10">
            <div
              className="inline-flex flex-wrap items-center justify-center gap-1 p-1.5 rounded-2xl border border-white/10"
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
              }}
            >
              {[
                { id: "guided", label: "Guided Mode", icon: Users },
                { id: "3d", label: "3D View", icon: Maximize2 },
                { id: "dashboard", label: "Dashboard", icon: Trophy },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 min-w-[150px] ${
                    viewMode === id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main 3-column Grid ────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-stretch xl:h-[700px]">
            {/* ── LEFT: Live Detection ───────────────────────────── */}
            <div className="flex flex-col gap-4 xl:col-span-4 h-full">
              {/* Camera Card */}
              <div className="glass-panel overflow-hidden flex flex-col h-full">
                {/* Card header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
                  <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/25">
                    <Camera size={18} className="text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white text-base">
                    Live Detection
                  </h3>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${webcamActive ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}
                    />
                    <span className="text-xs text-gray-400">
                      {webcamActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Camera feed */}
                <div className="p-4 flex flex-col flex-1 min-h-0">
                  <div className="rounded-2xl overflow-hidden bg-black/50 border border-white/8 mb-4 flex-1 min-h-0 relative">
                    {!webcamActive ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/15 rounded-2xl px-6 text-center">
                        <Camera size={40} className="text-gray-500" />
                        <p className="text-sm text-gray-400 font-medium max-w-xs">
                          Camera feed will appear here
                        </p>
                      </div>
                    ) : (
                      <FeedbackOverlay
                        status={realTimeState?.status || "scanning"}
                        detectedPiece={realTimeState?.detectedPiece}
                        requiredPiece={realTimeState?.expectedPieceType}
                        confidence={realTimeState?.confidence || 0}
                      >
                        <div className="relative w-full h-full">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          <AROverlay
                            detections={currentDetection?.pieces || []}
                            canvasSize={{ width: 640, height: 480 }}
                            confidence={realTimeState?.confidence || 0}
                            status={realTimeState?.status || "scanning"}
                          />
                        </div>
                      </FeedbackOverlay>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!webcamActive ? (
                      <button
                        onClick={startWebcam}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                        style={{
                          background:
                            "linear-gradient(135deg, #2563eb, #3b82f6)",
                        }}
                      >
                        <Camera size={16} /> Start Webcam
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={toggleDetection}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                          style={{
                            background: detectionActive
                              ? "linear-gradient(135deg, #dc2626, #ef4444)"
                              : "linear-gradient(135deg, #16a34a, #22c55e)",
                          }}
                        >
                          {detectionActive ? (
                            <Square size={15} />
                          ) : (
                            <Play size={15} />
                          )}
                          {detectionActive ? "Stop" : "Start Detection"}
                        </button>
                        <button
                          onClick={stopWebcam}
                          className="px-3.5 py-2.5 rounded-xl text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
                        >
                          <CameraOff size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Latest Detection badge */}
                {currentDetection && (
                  <div className="mx-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/8 shrink-0">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">
                        Last Detected
                      </p>
                      <p
                        className={`text-sm font-bold ${currentDetection.correct ? "text-green-400" : "text-yellow-400"}`}
                      >
                        {currentDetection.piece || "—"}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-gray-300 font-medium">
                      {Math.round((currentDetection.confidence || 0) * 100)}%
                      confidence
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── CENTER: Mode Panel ─────────────────────────────── */}
            <div className="flex flex-col xl:col-span-5 h-full overflow-hidden">
              {viewMode === "guided" && (
                <GuidedMode
                  detectedPiece={realTimeState?.detectedPiece}
                  onStepChange={handleStepChange}
                  assemblySteps={assemblySteps}
                />
              )}
              {viewMode === "3d" && (
                <div className="glass-panel p-5 md:p-6 flex-1 h-full min-h-[640px] flex flex-col">
                  <h3 className="font-bold text-white text-base mb-4 shrink-0">
                    3D Assembly View
                  </h3>
                  <div className="flex-1 min-h-0">
                    <ToyAssembly3D
                      detections={currentDetection?.pieces || []}
                      realTimeState={realTimeState}
                      onAssemblyChange={(state) =>
                        console.log("Assembly state:", state)
                      }
                    />
                  </div>
                </div>
              )}
              {viewMode === "dashboard" && (
                <div className="glass-panel p-5 md:p-6 flex-1 h-full min-h-[640px] flex justify-center items-center">
                  <Dashboard
                    currentStep={currentStep}
                    totalSteps={assemblySteps.length}
                    detectionHistory={detectionHistory}
                    sessionActive={sessionActive}
                    onReset={resetAssembly}
                    onExport={(data) => {
                      console.log("Exported:", data);
                      toast.success("Progress exported!");
                    }}
                  />
                </div>
              )}
            </div>

            {/* ── RIGHT: Progress + Stats + Actions ─────────────── */}
            <div className="flex flex-col gap-4 xl:col-span-3 h-full">
              {/* Assembly Progress */}
              <div className="glass-panel overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-5 py-4 border-b border-white/8 shrink-0">
                  <h4 className="font-bold text-white text-base">
                    Assembly Progress
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Step {Math.min(currentStep + 1, safeTotalSteps)} of{" "}
                    {safeTotalSteps}
                  </p>
                </div>
                {/* Progress bar */}
                <div className="px-5 py-3 border-b border-white/5 shrink-0">
                  <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width:
                          assemblySteps.length > 0
                            ? `${(currentStep / assemblySteps.length) * 100}%`
                            : "0%",
                        background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                      }}
                    />
                  </div>
                </div>
                <div
                  className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar min-h-0"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.1) transparent",
                  }}
                >
                  {visibleSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all shrink-0 ${
                        index < currentStep
                          ? "bg-green-500/10 border border-green-500/20"
                          : index === currentStep
                            ? "bg-blue-500/10 border border-blue-500/25"
                            : "border border-transparent opacity-60"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          index < currentStep
                            ? "bg-green-500 text-white"
                            : index === currentStep
                              ? "bg-blue-500 text-white ring-2 ring-blue-400/40"
                              : "bg-white/10 text-gray-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white capitalize">
                          {step.required_piece}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Stats */}
              <div className="glass-panel overflow-hidden shrink-0">
                <div className="px-5 py-4 border-b border-white/8">
                  <h4 className="font-bold text-white text-base">
                    Session Stats
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Attempts",
                      value: attempts,
                      color: "text-white",
                    },
                    {
                      label: "Correct",
                      value: correctAttempts,
                      color: "text-green-400",
                    },
                    {
                      label: "Accuracy",
                      value: `${accuracy}%`,
                      color: "text-blue-400",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="text-center p-3 rounded-xl bg-white/5 border border-white/8"
                    >
                      <p className={`text-xl font-black ${color}`}>{value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="glass-panel p-4 flex flex-col gap-2.5 shrink-0">
                <button
                  onClick={handleAssemblyComplete}
                  disabled={currentStep < assemblySteps.length - 1}
                  className="w-full py-3 px-5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  }}
                >
                  <Trophy size={17} /> Complete Assembly
                </button>
                <button
                  onClick={resetAssembly}
                  className="w-full py-3 px-5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all border border-white/10 hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <RotateCcw size={17} /> Reset Assembly
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="w-full py-3 px-5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-all border border-white/8 hover:border-white/20 hover:bg-white/5"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAssemblyDemo;
