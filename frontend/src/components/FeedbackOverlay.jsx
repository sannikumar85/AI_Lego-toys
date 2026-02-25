/**
 * Feedback Overlay Component
 * Provides real-time visual and audio feedback for part detection
 * Features: Green/red borders, animations, success/error sounds, scanning overlay
 */

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, X, Search } from 'lucide-react'

const FeedbackOverlay = ({ 
    status = 'searching', // 'correct' | 'wrong' | 'searching'
    detectedPiece = null,
    requiredPiece = null,
    confidence = 0,
    children 
}) => {
    const [showAnimation, setShowAnimation] = useState(false)
    const [animationType, setAnimationType] = useState(null)
    const audioContextRef = useRef(null)
    const scanLineRef = useRef(0)

    // Audio generation functions using Web Audio API
    const createAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        }
        return audioContextRef.current
    }

    const playSuccessSound = () => {
        try {
            const audioContext = createAudioContext()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.4)
        } catch (error) {
            console.log('Audio not available:', error)
        }
    }

    const playErrorSound = () => {
        try {
            const audioContext = createAudioContext()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime) // A3 (lower tone)
            oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.15) // G3 (even lower)
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)
        } catch (error) {
            console.log('Audio not available:', error)
        }
    }

    // Handle status changes and trigger appropriate effects
    useEffect(() => {
        setShowAnimation(false)
        
        setTimeout(() => {
            if (status === 'correct') {
                setAnimationType('success')
                setShowAnimation(true)
                playSuccessSound()
            } else if (status === 'wrong') {
                setAnimationType('error')
                setShowAnimation(true)
                playErrorSound()
            } else {
                setAnimationType('scanning')
                setShowAnimation(true)
            }
        }, 50)

        // Reset animation after duration
        const timer = setTimeout(() => {
            setShowAnimation(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [status, detectedPiece, requiredPiece])

    // Animated scanning line for searching state
    useEffect(() => {
        let animationFrame
        if (status === 'searching') {
            const animate = () => {
                scanLineRef.current = (scanLineRef.current + 2) % 100
                animationFrame = requestAnimationFrame(animate)
            }
            animate()
        }
        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame)
        }
    }, [status])

    const getBorderStyle = () => {
        switch (status) {
            case 'correct':
                return {
                    border: '4px solid #43e97b',
                    boxShadow: `
                        0 0 20px rgba(67, 233, 123, 0.6),
                        0 0 40px rgba(67, 233, 123, 0.4),
                        inset 0 0 20px rgba(67, 233, 123, 0.2)
                    `,
                    animation: showAnimation ? 'glow-green 0.5s ease-in-out' : 'none'
                }
            case 'wrong':
                return {
                    border: '4px solid #ff6584',
                    boxShadow: `
                        0 0 20px rgba(255, 101, 132, 0.6),
                        0 0 40px rgba(255, 101, 132, 0.4)
                    `,
                    animation: showAnimation ? 'pulse-red 0.6s ease-in-out' : 'none'
                }
            case 'searching':
            default:
                return {
                    border: '3px solid #ffd93d',
                    boxShadow: `
                        0 0 15px rgba(255, 217, 61, 0.4),
                        0 0 30px rgba(255, 217, 61, 0.2)
                    `,
                    animation: showAnimation ? 'pulse-yellow 2s ease-in-out infinite' : 'none'
                }
        }
    }

    const getOverlayContent = () => {
        switch (status) {
            case 'correct':
                return (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        animation: showAnimation ? 'success-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            background: 'rgba(67, 233, 123, 0.95)',
                            borderRadius: '50%',
                            padding: '1.5rem',
                            border: '3px solid white',
                            boxShadow: '0 8px 32px rgba(67, 233, 123, 0.4)'
                        }}>
                            <CheckCircle size={48} color="white" />
                        </div>
                        <div style={{
                            background: 'rgba(67, 233, 123, 0.95)',
                            padding: '0.75rem 2rem',
                            borderRadius: '25px',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '1.2rem',
                            textAlign: 'center',
                            border: '2px solid white',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            ✓ Correct! {detectedPiece}
                            <div style={{ fontSize: '0.9rem', fontWeight: '500', marginTop: '0.25rem' }}>
                                Confidence: {Math.round(confidence * 100)}%
                            </div>
                        </div>
                    </div>
                )

            case 'wrong':
                return (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        animation: showAnimation ? 'error-shake 0.6s ease-in-out' : 'none',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            background: 'rgba(255, 101, 132, 0.95)',
                            borderRadius: '50%',
                            padding: '1.5rem',
                            border: '3px solid white',
                            boxShadow: '0 8px 32px rgba(255, 101, 132, 0.4)'
                        }}>
                            <X size={48} color="white" strokeWidth={3} />
                        </div>
                        <div style={{
                            background: 'rgba(255, 101, 132, 0.95)',
                            padding: '0.75rem 2rem',
                            borderRadius: '25px',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            textAlign: 'center',
                            border: '2px solid white',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            ✗ Wrong Piece
                            <div style={{ fontSize: '0.9rem', fontWeight: '500', marginTop: '0.25rem' }}>
                                Need: {requiredPiece}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '400', marginTop: '0.25rem' }}>
                                Detected: {detectedPiece}
                            </div>
                        </div>
                    </div>
                )

            case 'searching':
            default:
                return (
                    <>
                        {/* Animated Scanning Line */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: `${scanLineRef.current}%`,
                            width: '3px',
                            height: '100%',
                            background: 'linear-gradient(to bottom, transparent, #ffd93d, transparent)',
                            boxShadow: '0 0 10px #ffd93d',
                            animation: 'scan-line 3s ease-in-out infinite',
                            pointerEvents: 'none'
                        }} />
                        
                        {/* Scanning Indicator */}
                        <div style={{
                            position: 'absolute',
                            top: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'rgba(255, 217, 61, 0.95)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '25px',
                            color: '#333',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: '2px solid white',
                            boxShadow: '0 4px 16px rgba(255, 217, 61, 0.4)',
                            animation: showAnimation ? 'pulse-scanning 2s ease-in-out infinite' : 'none',
                            pointerEvents: 'none'
                        }}>
                            <Search size={20} />
                            <span>Scanning for toy parts...</span>
                        </div>

                        {/* Corner scanning indicators */}
                        {[
                            { top: '1rem', left: '1rem' },
                            { top: '1rem', right: '1rem' },
                            { bottom: '1rem', left: '1rem' },
                            { bottom: '1rem', right: '1rem' }
                        ].map((position, index) => (
                            <div key={index} style={{
                                position: 'absolute',
                                ...position,
                                width: '20px',
                                height: '20px',
                                border: '3px solid #ffd93d',
                                borderRadius: '3px',
                                animation: `corner-pulse ${1 + index * 0.2}s ease-in-out infinite`,
                                pointerEvents: 'none'
                            }} />
                        ))}
                    </>
                )
        }
    }

    return (
        <div style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            ...getBorderStyle()
        }}>
            {children}
            {getOverlayContent()}
            
            {/* CSS Keyframes Injection */}
            <style jsx>{`
                @keyframes glow-green {
                    0% { box-shadow: 0 0 5px rgba(67, 233, 123, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(67, 233, 123, 0.8), 0 0 80px rgba(67, 233, 123, 0.6); }
                    100% { box-shadow: 0 0 20px rgba(67, 233, 123, 0.6); }
                }
                
                @keyframes pulse-red {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.02); }
                    50% { transform: scale(0.98); }
                    75% { transform: scale(1.01); }
                }
                
                @keyframes pulse-yellow {
                    0%, 100% { box-shadow: 0 0 15px rgba(255, 217, 61, 0.4); }
                    50% { box-shadow: 0 0 25px rgba(255, 217, 61, 0.6), 0 0 50px rgba(255, 217, 61, 0.3); }
                }
                
                @keyframes success-pop {
                    0% { 
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    }
                    70% { 
                        transform: translate(-50%, -50%) scale(1.1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
                
                @keyframes error-shake {
                    0%, 100% { transform: translate(-50%, -50%) translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-50%, -50%) translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translate(-50%, -50%) translateX(5px); }
                }
                
                @keyframes scan-line {
                    0% { left: -5%; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { left: 105%; opacity: 0; }
                }
                
                @keyframes pulse-scanning {
                    0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
                }
                
                @keyframes corner-pulse {
                    0%, 100% { 
                        opacity: 0.6;
                        border-color: #ffd93d;
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 1;
                        border-color: #ffed4e;
                        transform: scale(1.2);
                    }
                }
            `}</style>
        </div>
    )
}

export default FeedbackOverlay