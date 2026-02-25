/**
 * Real-time Assembly Demo Page
 * Integrates all new real-time features: webcam detection, guided mode, 
 * feedback overlay, enhanced 3D viewer, dashboard, and AR overlay
 */

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
    Camera, CameraOff, Play, Square, RotateCcw, 
    Settings, Maximize2, Users, Trophy 
} from 'lucide-react'

// Import all our new components
import GuidedMode from '../components/GuidedMode'
import FeedbackOverlay from '../components/FeedbackOverlay'
import ToyAssembly3D from '../components/3d/ToyAssembly3D'
import Dashboard from '../components/Dashboard'
import AROverlay from '../components/AROverlay'

// Import API functions
import { 
    detectToyParts, 
    validateStep, 
    startAssemblySession, 
    completeAssemblySession,
    getAssemblySteps 
} from '../services/api'

const RealTimeAssemblyDemo = () => {
    const navigate = useNavigate()
    
    // Webcam State
    const [webcamActive, setWebcamActive] = useState(false)
    const [detectionActive, setDetectionActive] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const detectionIntervalRef = useRef(null)

    // Assembly Session State
    const [sessionId, setSessionId] = useState(null)
    const [assemblySteps, setAssemblySteps] = useState([])
    const [currentStep, setCurrentStep] = useState(0)
    const [sessionActive, setSessionActive] = useState(false)

    // Detection State
    const [currentDetection, setCurrentDetection] = useState(null)
    const [detectionHistory, setDetectionHistory] = useState([])
    const [realTimeState, setRealTimeState] = useState(null)

    // UI State
    const [viewMode, setViewMode] = useState('guided') // 'guided' | '3d' | 'dashboard'
    const [showSettings, setShowSettings] = useState(false)

    // Initialize assembly session
    useEffect(() => {
        const initSession = async () => {
            try {
                const steps = await getAssemblySteps('demo_set')
                setAssemblySteps(steps.steps)
                
                const session = await startAssemblySession('demo_set', 'Demo User')
                setSessionId(session.sessionId)
                setSessionActive(true)
                
                toast.success('🎯 Assembly session started!')
            } catch (error) {
                console.error('Failed to initialize session:', error)
                toast.error('Failed to start assembly session')
            }
        }

        initSession()
    }, [])

    // Webcam Functions
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: 'environment' } 
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setWebcamActive(true)
                toast.success('📸 Webcam started!')
            }
        } catch (error) {
            toast.error('Camera access failed. Please allow permissions.')
        }
    }

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setWebcamActive(false)
        setDetectionActive(false)
        clearInterval(detectionIntervalRef.current)
        setCurrentDetection(null)
        setRealTimeState(null)
        toast('📸 Webcam stopped')
    }

    const captureFrame = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return null

        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        return canvas.toDataURL('image/jpeg', 0.8)
    }

    const toggleDetection = async () => {
        if (detectionActive) {
            clearInterval(detectionIntervalRef.current)
            setDetectionActive(false)
            setRealTimeState({ status: 'scanning' })
        } else {
            setDetectionActive(true)
            
            detectionIntervalRef.current = setInterval(async () => {
                await performDetection()
            }, 1500)
        }
    }

    const performDetection = async () => {
        const frameData = captureFrame()
        if (!frameData || !assemblySteps.length) return

        try {
            // Convert base64 to blob for API
            const response = await fetch(frameData)
            const blob = await response.blob()
            const formData = new FormData()
            formData.append('images', blob, 'webcam-frame.jpg')

            const result = await detectToyParts(formData)
            const detectedPieces = result.detections || []
            
            const currentStepData = assemblySteps[currentStep]
            let detectionStatus = 'scanning'
            let detectedPiece = null
            let confidence = 0

            if (detectedPieces.length > 0) {
                const bestDetection = detectedPieces[0]
                detectedPiece = bestDetection.class_name
                confidence = bestDetection.confidence
                
                // Validate against current step
                if (currentStepData && detectedPiece.toLowerCase() === currentStepData.required_piece.toLowerCase()) {
                    detectionStatus = 'correct'
                    
                    // Validate with backend
                    const validation = await validateStep(detectedPiece, currentStep, sessionId, confidence)
                    
                    if (validation.correct) {
                        toast.success(`✓ Correct! ${detectedPiece} detected`)
                    }
                } else {
                    detectionStatus = 'wrong'
                }
            }

            // Update detection state
            const detection = {
                timestamp: Date.now(),
                pieces: detectedPieces,
                confidence,
                correct: detectionStatus === 'correct',
                step: currentStep + 1,
                piece: detectedPiece
            }
            
            setCurrentDetection(detection)
            setDetectionHistory(prev => [detection, ...prev.slice(0, 19)]) // Keep last 20
            
            // Update real-time state for components
            setRealTimeState({
                status: detectionStatus,
                detectedPiece,
                expectedPieceType: currentStepData?.required_piece,
                confidence
            })
            
        } catch (error) {
            console.error('Detection error:', error)
        }
    }

    const handleStepChange = (stepData, stepIndex) => {
        setCurrentStep(stepIndex)
        setRealTimeState(prev => ({
            ...prev,
            expectedPieceType: stepData.required_piece
        }))
    }

    const handleAssemblyComplete = async () => {
        try {
            if (sessionId) {
                await completeAssemblySession(sessionId)
            }
            setSessionActive(false)
            toast.success('🎉 Assembly completed!')
        } catch (error) {
            console.error('Failed to complete session:', error)
        }
    }

    const resetAssembly = async () => {
        try {
            // Start new session
            const session = await startAssemblySession('demo_set', 'Demo User')
            setSessionId(session.sessionId)
            setCurrentStep(0)
            setDetectionHistory([])
            setSessionActive(true)
            toast('🔄 Assembly reset!')
        } catch (error) {
            console.error('Failed to reset assembly:', error)
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam()
            clearInterval(detectionIntervalRef.current)
        }
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
            <div className="container mx-auto px-6 py-8">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        🤖 Real-time Assembly Assistant
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Experience the future of guided assembly with live webcam detection, 
                        AR-style overlays, and step-by-step 3D visualization
                    </p>
                </div>

                {/* View Mode Selector */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 flex gap-1">
                        {[
                            { id: 'guided', label: '🎯 Guided Mode', icon: Users },
                            { id: '3d', label: '🎮 3D View', icon: Maximize2 },
                            { id: 'dashboard', label: '📊 Dashboard', icon: Trophy }
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setViewMode(id)}
                                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                    viewMode === id 
                                        ? 'bg-purple-600 text-white shadow-lg' 
                                        : 'text-gray-300 hover:bg-gray-700/50'
                                }`}
                            >
                                <Icon size={18} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Panel: Webcam Feed */}
                    <div className="lg:col-span-1">
                        <div className="glass-card p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Camera size={24} className="text-blue-400" />
                                Live Detection
                            </h3>
                            
                            {/* Webcam Container */}
                            <div className="relative mb-4">
                                {!webcamActive ? (
                                    <div className="aspect-video bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                                        <div className="text-center">
                                            <Camera size={48} className="text-gray-500 mx-auto mb-3" />
                                            <p className="text-gray-400">Click to start webcam</p>
                                        </div>
                                    </div>
                                ) : (
                                    <FeedbackOverlay
                                        status={realTimeState?.status || 'scanning'}
                                        detectedPiece={realTimeState?.detectedPiece}
                                        requiredPiece={realTimeState?.expectedPieceType}
                                        confidence={realTimeState?.confidence || 0}
                                    >
                                        <div className="relative">
                                            <video 
                                                ref={videoRef}
                                                autoPlay 
                                                playsInline 
                                                muted
                                                className="w-full aspect-video rounded-lg object-cover"
                                            />
                                            <canvas ref={canvasRef} className="hidden" />
                                            
                                            {/* AR Overlay */}
                                            <AROverlay 
                                                detections={currentDetection?.pieces || []}
                                                canvasSize={{ width: 640, height: 480 }}
                                                confidence={realTimeState?.confidence || 0}
                                                status={realTimeState?.status || 'scanning'}
                                            />
                                        </div>
                                    </FeedbackOverlay>
                                )}
                            </div>

                            {/* Webcam Controls */}
                            <div className="flex gap-2">
                                {!webcamActive ? (
                                    <button 
                                        onClick={startWebcam}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        <Camera size={18} /> Start Webcam
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={toggleDetection}
                                            className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
                                                detectionActive ? 'bg-red-500 hover:bg-red-600' : ''
                                            }`}
                                        >
                                            {detectionActive ? <Square size={16} /> : <Play size={16} />}
                                            {detectionActive ? 'Stop Detection' : 'Start Detection'}
                                        </button>
                                        <button 
                                            onClick={stopWebcam}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                        >
                                            <CameraOff size={18} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Detection Info */}
                            {currentDetection && (
                                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                                    <div className="text-sm text-gray-300 mb-1">Latest Detection:</div>
                                    <div className={`font-semibold ${
                                        currentDetection.correct ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                        {currentDetection.piece || 'No piece detected'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Confidence: {Math.round((currentDetection.confidence || 0) * 100)}%
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center Panel: Main View */}
                    <div className="lg:col-span-1">
                        {viewMode === 'guided' && (
                            <GuidedMode 
                                detectedPiece={realTimeState?.detectedPiece}
                                onStepChange={handleStepChange}
                                assemblySteps={assemblySteps}
                            />
                        )}
                        
                        {viewMode === '3d' && (
                            <div className="glass-card p-6">
                                <h3 className="text-xl font-bold text-white mb-4">3D Assembly View</h3>
                                <ToyAssembly3D 
                                    detections={currentDetection?.pieces || []}
                                    realTimeState={realTimeState}
                                    onAssemblyChange={(state) => {
                                        console.log('Assembly state changed:', state)
                                    }}
                                />
                            </div>
                        )}
                        
                        {viewMode === 'dashboard' && (
                            <Dashboard 
                                currentStep={currentStep}
                                totalSteps={assemblySteps.length}
                                detectionHistory={detectionHistory}
                                sessionActive={sessionActive}
                                onReset={resetAssembly}
                                onExport={(data) => {
                                    console.log('Exported data:', data)
                                    toast.success('Progress exported!')
                                }}
                            />
                        )}
                    </div>

                    {/* Right Panel: Stats & Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Assembly Progress */}
                        <div className="glass-card p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Assembly Progress</h4>
                            <div className="space-y-3">
                                {assemblySteps.slice(0, 8).map((step, index) => (
                                    <div 
                                        key={index}
                                        className={`flex items-center gap-3 p-2 rounded-lg ${
                                            index < currentStep ? 'bg-green-500/20' :
                                            index === currentStep ? 'bg-blue-500/20' : 'bg-gray-700/30'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            index < currentStep ? 'bg-green-500 text-white' :
                                            index === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-white font-medium">
                                                {step.required_piece}
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                {step.instruction}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="glass-card p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Session Stats</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Total Attempts</span>
                                    <span className="text-white font-semibold">{detectionHistory.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Correct Detections</span>
                                    <span className="text-green-400 font-semibold">
                                        {detectionHistory.filter(d => d.correct).length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Accuracy</span>
                                    <span className="text-blue-400 font-semibold">
                                        {detectionHistory.length > 0 
                                            ? Math.round((detectionHistory.filter(d => d.correct).length / detectionHistory.length) * 100)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button 
                                onClick={handleAssemblyComplete}
                                disabled={currentStep < assemblySteps.length - 1}
                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trophy size={18} />
                                Complete Assembly
                            </button>
                            
                            <button 
                                onClick={resetAssembly}
                                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={18} />
                                Reset Assembly
                            </button>
                            
                            <button 
                                onClick={() => navigate('/')}
                                className="w-full px-4 py-2 border border-gray-600 hover:bg-gray-800 text-gray-300 rounded-lg transition-colors"
                            >
                                ← Back to Main
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RealTimeAssemblyDemo