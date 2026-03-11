/**
 * Guided Assembly Mode Component
 * Provides step-by-step assembly guidance with real-time piece validation
 * Features: Auto-advancement, progress tracking, instructions display
 */

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Package,
  Trophy,
} from "lucide-react";
import confetti from "canvas-confetti";

const GuidedMode = ({
  detectedPiece = null,
  onStepChange = () => {},
  assemblySteps = [],
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [correctDetectionCount, setCorrectDetectionCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [sessionStartTime] = useState(Date.now());

  // Default demo steps if none provided
  const defaultSteps = [
    {
      id: 1,
      required_piece: "body",
      instruction: "Place the main body piece as the foundation",
      position: { x: 0, y: 0, z: 0 },
      color: "#6c63ff",
    },
    {
      id: 2,
      required_piece: "head",
      instruction: "Attach the head piece on top of the body",
      position: { x: 0, y: 1, z: 0 },
      color: "#ff6584",
    },
    {
      id: 3,
      required_piece: "arm",
      instruction: "Add the left arm to the side of the body",
      position: { x: -1, y: 0.5, z: 0 },
      color: "#43e97b",
    },
    {
      id: 4,
      required_piece: "arm",
      instruction: "Add the right arm to complete the upper body",
      position: { x: 1, y: 0.5, z: 0 },
      color: "#43e97b",
    },
    {
      id: 5,
      required_piece: "wheel",
      instruction: "Attach the first wheel to the bottom left",
      position: { x: -0.5, y: -1, z: 0 },
      color: "#ffd93d",
    },
    {
      id: 6,
      required_piece: "wheel",
      instruction: "Attach the second wheel to the bottom right",
      position: { x: 0.5, y: -1, z: 0 },
      color: "#ffd93d",
    },
    {
      id: 7,
      required_piece: "wheel",
      instruction: "Add the third wheel for stability",
      position: { x: 0, y: -1, z: 0.5 },
      color: "#ffd93d",
    },
    {
      id: 8,
      required_piece: "accessory",
      instruction: "Add the final accessory piece to complete the toy",
      position: { x: 0, y: 1.5, z: 0 },
      color: "#4ecdc4",
    },
  ];

  const steps = assemblySteps.length > 0 ? assemblySteps : defaultSteps;
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  // Handle piece detection validation
  useEffect(() => {
    if (!detectedPiece || !currentStep || isCompleted) return;

    const isCorrect =
      detectedPiece.toLowerCase() === currentStep.required_piece.toLowerCase();
    const timestamp = Date.now();

    // Add to detection history
    setDetectionHistory((prev) => [
      {
        piece: detectedPiece,
        correct: isCorrect,
        timestamp,
        step: currentStepIndex + 1,
      },
      ...prev.slice(0, 9),
    ]);

    if (isCorrect) {
      setCorrectDetectionCount((prev) => prev + 1);
    } else {
      setCorrectDetectionCount(0); // Reset on wrong detection
    }
  }, [detectedPiece, currentStep, currentStepIndex, isCompleted]);

  // Auto-advance on 2 consecutive correct detections
  useEffect(() => {
    if (correctDetectionCount >= 2 && !isCompleted) {
      setTimeout(() => {
        advanceStep();
        setCorrectDetectionCount(0);
      }, 1000); // Small delay for visual feedback
    }
  }, [correctDetectionCount, isCompleted]);

  const advanceStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange(steps[nextIndex], nextIndex);
    } else {
      completeAssembly();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setCorrectDetectionCount(0);
      onStepChange(steps[prevIndex], prevIndex);
    }
  };

  const resetAssembly = () => {
    setCurrentStepIndex(0);
    setCorrectDetectionCount(0);
    setIsCompleted(false);
    setDetectionHistory([]);
    onStepChange(steps[0], 0);
  };

  const completeAssembly = () => {
    setIsCompleted(true);
    // Confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 120,
        origin: { y: 0.8 },
      });
    }, 300);
  };

  const getStatusIcon = (detection) => {
    return detection.correct ? (
      <CheckCircle size={16} color="#43e97b" />
    ) : (
      <AlertCircle size={16} color="#ff6584" />
    );
  };

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isCompleted) {
    return (
      <div className="glass-panel p-8 text-center max-w-xl mx-auto">
        <div className="mb-8">
          <Trophy size={64} className="mx-auto mb-4 text-yellow-400" />
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(67,233,123,0.3)]">
            Assembly Complete! 🎉
          </h2>
          <p className="text-gray-300 text-lg mb-6 font-medium">
            Congratulations! You've successfully assembled your toy.
          </p>
          <div className="grid grid-cols-2 gap-4 bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {totalSteps}
              </div>
              <div className="text-sm text-gray-400 font-medium mt-1">
                Steps Completed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {getElapsedTime()}
              </div>
              <div className="text-sm text-gray-400 font-medium mt-1">
                Time Taken
              </div>
            </div>
          </div>
        </div>

        <button
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
          onClick={resetAssembly}
        >
          <RotateCcw size={20} /> Start New Assembly
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 md:p-8 w-full mx-auto flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="text-center mb-4 shrink-0">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <Package size={20} className="text-blue-400" />
          </div>
          Guided Assembly Mode
        </h2>
        <p className="text-gray-300 text-xs font-medium mt-1">
          Follow the steps and hold each piece for automatic detection
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-400">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <span className="text-sm font-bold text-blue-400">
            {Math.round(progressPercent)}% Complete
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(108,99,255,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current Step Card */}
      <div className="flex-1 flex flex-col justify-center bg-black/20 rounded-2xl p-4 border border-white/5 mb-4 shadow-inner min-h-0 overflow-hidden">
        {/* Required Piece */}
        <div className="text-center mb-4">
          <div
            className="text-4xl font-black uppercase tracking-wider mb-2"
            style={{
              color: currentStep?.color || "#6c63ff",
              textShadow: `0 4px 20px ${currentStep?.color}60`,
            }}
          >
            {currentStep?.required_piece}
          </div>
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center border-4 shadow-lg mb-2"
            style={{
              background: `${currentStep?.color}15`,
              borderColor: `${currentStep?.color}40`,
              boxShadow: `0 0 30px ${currentStep?.color}20`,
            }}
          >
            <Package size={28} color={currentStep?.color} />
          </div>
        </div>

        {/* Instruction */}
        <div className="text-center text-base text-gray-200 font-medium leading-relaxed px-2">
          {currentStep?.instruction}
        </div>
      </div>

      {/* Detection Status */}
      <div
        className={`shrink-0 p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border ${
          detectedPiece &&
          detectedPiece.toLowerCase() ===
            currentStep?.required_piece.toLowerCase()
            ? "bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(67,233,123,0.15)]"
            : "bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_rgba(255,211,61,0.15)]"
        }`}
      >
        {detectedPiece &&
        detectedPiece.toLowerCase() ===
          currentStep?.required_piece.toLowerCase() ? (
          <>
            <CheckCircle size={24} className="text-green-400 mb-1" />
            <div className="text-green-400 font-bold text-base">
              ✓ Correct piece detected! ({correctDetectionCount}/2)
            </div>
            <div className="text-xs text-green-400/80 font-medium">
              {correctDetectionCount < 2
                ? "Hold steady for auto-advance..."
                : "Advancing to next step..."}
            </div>
          </>
        ) : (
          <>
            <AlertCircle size={24} className="text-yellow-400 mb-1" />
            <div className="text-yellow-400 font-bold text-base">
              {detectedPiece
                ? `Wrong piece: ${detectedPiece}`
                : "Scanning for pieces..."}
            </div>
            <div className="text-xs text-yellow-400/80 font-medium">
              Looking for: {currentStep?.required_piece}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 mb-0 shrink-0">
        <button
          onClick={previousStep}
          disabled={currentStepIndex === 0}
          className={`flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-semibold border transition-all text-sm ${
            currentStepIndex === 0
              ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
              : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400"
          }`}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          onClick={resetAssembly}
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-400 transition-all text-sm"
        >
          <RotateCcw size={16} /> Reset
        </button>

        <button
          onClick={advanceStep}
          disabled={currentStepIndex === totalSteps - 1}
          className={`flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-semibold border transition-all text-sm ${
            currentStepIndex === totalSteps - 1
              ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
              : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-400"
          }`}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* Detection History */}
      {detectionHistory.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mt-auto">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 ml-1 tracking-wider">
            Recent Detections
          </h4>
          <div className="max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
            {detectionHistory.slice(0, 5).map((detection, index) => (
              <div
                key={index}
                className={`flex items-center justify-between py-2 px-3 mb-1.5 rounded-xl ${
                  index === 0
                    ? "bg-white/5 border border-white/5 shadow-inner"
                    : "hover:bg-white/5 border border-transparent"
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(detection)}
                  <span className="text-sm font-medium text-gray-200">
                    {detection.piece}{" "}
                    <span className="text-gray-500 text-xs ml-1">
                      (Step {detection.step})
                    </span>
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-black/30 px-2 py-1 rounded-md border border-white/5">
                  {new Date(detection.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedMode;
