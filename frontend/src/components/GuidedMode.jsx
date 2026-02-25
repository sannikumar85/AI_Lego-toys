/**
 * Guided Assembly Mode Component
 * Provides step-by-step assembly guidance with real-time piece validation
 * Features: Auto-advancement, progress tracking, instructions display
 */

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, AlertCircle, Package, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'

const GuidedMode = ({ 
    detectedPiece = null, 
    onStepChange = () => {}, 
    assemblySteps = [] 
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [correctDetectionCount, setCorrectDetectionCount] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [detectionHistory, setDetectionHistory] = useState([])
    const [sessionStartTime] = useState(Date.now())

    // Default demo steps if none provided
    const defaultSteps = [
        { id: 1, required_piece: 'body', instruction: 'Place the main body piece as the foundation', position: { x: 0, y: 0, z: 0 }, color: '#6c63ff' },
        { id: 2, required_piece: 'head', instruction: 'Attach the head piece on top of the body', position: { x: 0, y: 1, z: 0 }, color: '#ff6584' },
        { id: 3, required_piece: 'arm', instruction: 'Add the left arm to the side of the body', position: { x: -1, y: 0.5, z: 0 }, color: '#43e97b' },
        { id: 4, required_piece: 'arm', instruction: 'Add the right arm to complete the upper body', position: { x: 1, y: 0.5, z: 0 }, color: '#43e97b' },
        { id: 5, required_piece: 'wheel', instruction: 'Attach the first wheel to the bottom left', position: { x: -0.5, y: -1, z: 0 }, color: '#ffd93d' },
        { id: 6, required_piece: 'wheel', instruction: 'Attach the second wheel to the bottom right', position: { x: 0.5, y: -1, z: 0 }, color: '#ffd93d' },
        { id: 7, required_piece: 'wheel', instruction: 'Add the third wheel for stability', position: { x: 0, y: -1, z: 0.5 }, color: '#ffd93d' },
        { id: 8, required_piece: 'accessory', instruction: 'Add the final accessory piece to complete the toy', position: { x: 0, y: 1.5, z: 0 }, color: '#4ecdc4' }
    ]

    const steps = assemblySteps.length > 0 ? assemblySteps : defaultSteps
    const currentStep = steps[currentStepIndex]
    const totalSteps = steps.length
    const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100

    // Handle piece detection validation
    useEffect(() => {
        if (!detectedPiece || !currentStep || isCompleted) return

        const isCorrect = detectedPiece.toLowerCase() === currentStep.required_piece.toLowerCase()
        const timestamp = Date.now()

        // Add to detection history
        setDetectionHistory(prev => [{
            piece: detectedPiece,
            correct: isCorrect,
            timestamp,
            step: currentStepIndex + 1
        }, ...prev.slice(0, 9)])

        if (isCorrect) {
            setCorrectDetectionCount(prev => prev + 1)
        } else {
            setCorrectDetectionCount(0) // Reset on wrong detection
        }
    }, [detectedPiece, currentStep, currentStepIndex, isCompleted])

    // Auto-advance on 2 consecutive correct detections
    useEffect(() => {
        if (correctDetectionCount >= 2 && !isCompleted) {
            setTimeout(() => {
                advanceStep()
                setCorrectDetectionCount(0)
            }, 1000) // Small delay for visual feedback
        }
    }, [correctDetectionCount, isCompleted])

    const advanceStep = () => {
        if (currentStepIndex < totalSteps - 1) {
            const nextIndex = currentStepIndex + 1
            setCurrentStepIndex(nextIndex)
            onStepChange(steps[nextIndex], nextIndex)
        } else {
            completeAssembly()
        }
    }

    const previousStep = () => {
        if (currentStepIndex > 0) {
            const prevIndex = currentStepIndex - 1
            setCurrentStepIndex(prevIndex)
            setCorrectDetectionCount(0)
            onStepChange(steps[prevIndex], prevIndex)
        }
    }

    const resetAssembly = () => {
        setCurrentStepIndex(0)
        setCorrectDetectionCount(0)
        setIsCompleted(false)
        setDetectionHistory([])
        onStepChange(steps[0], 0)
    }

    const completeAssembly = () => {
        setIsCompleted(true)
        // Confetti celebration
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        })
        setTimeout(() => {
            confetti({
                particleCount: 50,
                spread: 120,
                origin: { y: 0.8 }
            })
        }, 300)
    }

    const getStatusIcon = (detection) => {
        return detection.correct ? (
            <CheckCircle size={16} color="#43e97b" />
        ) : (
            <AlertCircle size={16} color="#ff6584" />
        )
    }

    const getElapsedTime = () => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
        const minutes = Math.floor(elapsed / 60)
        const seconds = elapsed % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    if (isCompleted) {
        return (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Trophy size={64} color="#ffd93d" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ 
                        fontSize: '2rem', fontWeight: 800, color: '#43e97b', marginBottom: '1rem',
                        textShadow: '0 0 20px rgba(67, 233, 123, 0.5)'
                    }}>
                        Assembly Complete! 🎉
                    </h2>
                    <p style={{ color: '#8a8ab0', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        Congratulations! You've successfully assembled your toy.
                    </p>
                    <div style={{ 
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
                        background: 'rgba(67, 233, 123, 0.1)', borderRadius: 12, padding: '1rem',
                        border: '1px solid rgba(67, 233, 123, 0.3)'
                    }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#43e97b' }}>
                                {totalSteps}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#8a8ab0' }}>Steps Completed</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#43e97b' }}>
                                {getElapsedTime()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#8a8ab0' }}>Time Taken</div>
                        </div>
                    </div>
                </div>
                
                <button 
                    className="btn-primary"
                    onClick={resetAssembly}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                >
                    <RotateCcw size={18} /> Start New Assembly
                </button>
            </div>
        )
    }

    return (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ 
                    fontSize: '1.5rem', fontWeight: 700, color: '#f0f0ff', marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                    <Package size={24} color="#6c63ff" />
                    Guided Assembly Mode
                </h2>
                <p style={{ color: '#8a8ab0', fontSize: '0.9rem' }}>
                    Follow the steps and hold each piece for automatic detection
                </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#8a8ab0' }}>
                        Step {currentStepIndex + 1} of {totalSteps}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#8a8ab0' }}>
                        {Math.round(progressPercent)}% Complete
                    </span>
                </div>
                <div style={{ 
                    width: '100%', height: '8px', background: 'rgba(108,99,255,0.2)', 
                    borderRadius: '4px', overflow: 'hidden'
                }}>
                    <div 
                        style={{ 
                            width: `${progressPercent}%`, height: '100%', 
                            background: 'linear-gradient(90deg, #6c63ff, #43e97b)',
                            borderRadius: '4px', transition: 'width 0.5s ease'
                        }} 
                    />
                </div>
            </div>

            {/* Current Step Card */}
            <div style={{ 
                background: 'rgba(108,99,255,0.1)', borderRadius: 16, padding: '2rem',
                border: '1px solid rgba(108,99,255,0.3)', marginBottom: '2rem'
            }}>
                {/* Required Piece */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ 
                        fontSize: '3rem', fontWeight: 800, color: currentStep?.color || '#6c63ff',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        textShadow: `0 0 20px ${currentStep?.color}40`
                    }}>
                        {currentStep?.required_piece}
                    </div>
                    <div style={{ 
                        width: 80, height: 80, margin: '1rem auto',
                        background: `${currentStep?.color}20`, borderRadius: '50%',
                        border: `2px solid ${currentStep?.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Package size={32} color={currentStep?.color} />
                    </div>
                </div>

                {/* Instruction */}
                <div style={{ 
                    textAlign: 'center', fontSize: '1.1rem', color: '#f0f0ff',
                    lineHeight: 1.6, marginBottom: '1.5rem'
                }}>
                    {currentStep?.instruction}
                </div>

                {/* Detection Status */}
                <div style={{
                    padding: '1rem', borderRadius: 12,
                    background: detectedPiece && detectedPiece.toLowerCase() === currentStep?.required_piece.toLowerCase()
                        ? 'rgba(67, 233, 123, 0.2)' : 'rgba(255, 211, 61, 0.2)',
                    border: detectedPiece && detectedPiece.toLowerCase() === currentStep?.required_piece.toLowerCase()
                        ? '1px solid rgba(67, 233, 123, 0.4)' : '1px solid rgba(255, 211, 61, 0.4)',
                    textAlign: 'center'
                }}>
                    {detectedPiece && detectedPiece.toLowerCase() === currentStep?.required_piece.toLowerCase() ? (
                        <div>
                            <CheckCircle size={24} color="#43e97b" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ color: '#43e97b', fontWeight: 600 }}>
                                ✓ Correct piece detected! ({correctDetectionCount}/2)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#8a8ab0' }}>
                                {correctDetectionCount < 2 ? 'Hold steady for auto-advance...' : 'Advancing to next step...'}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <AlertCircle size={24} color="#ffd93d" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ color: '#ffd93d', fontWeight: 600 }}>
                                {detectedPiece ? `Wrong piece: ${detectedPiece}` : 'Scanning for pieces...'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#8a8ab0' }}>
                                Looking for: {currentStep?.required_piece}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: '1rem', marginBottom: '2rem'
            }}>
                <button 
                    onClick={previousStep}
                    disabled={currentStepIndex === 0}
                    style={{
                        background: currentStepIndex === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid rgba(108,99,255,0.5)', borderRadius: 8,
                        color: currentStepIndex === 0 ? '#666' : '#6c63ff', padding: '0.5rem 1rem',
                        cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <ChevronLeft size={16} /> Previous
                </button>

                <button 
                    className="btn-primary"
                    onClick={resetAssembly}
                    style={{ 
                        background: 'rgba(255,101,132,0.2)', border: '1px solid rgba(255,101,132,0.5)',
                        color: '#ff6584', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <RotateCcw size={16} /> Reset
                </button>

                <button 
                    onClick={advanceStep}
                    disabled={currentStepIndex === totalSteps - 1}
                    style={{
                        background: currentStepIndex === totalSteps - 1 ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid rgba(67,233,123,0.5)', borderRadius: 8,
                        color: currentStepIndex === totalSteps - 1 ? '#666' : '#43e97b', padding: '0.5rem 1rem',
                        cursor: currentStepIndex === totalSteps - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>

            {/* Detection History */}
            {detectionHistory.length > 0 && (
                <div style={{ 
                    background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#8a8ab0', marginBottom: '0.75rem' }}>
                        Recent Detections:
                    </h4>
                    <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                        {detectionHistory.slice(0, 5).map((detection, index) => (
                            <div key={index} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 0', borderBottom: index < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {getStatusIcon(detection)}
                                    <span style={{ fontSize: '0.8rem', color: '#f0f0ff' }}>
                                        {detection.piece} (Step {detection.step})
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#8a8ab0' }}>
                                    {new Date(detection.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default GuidedMode