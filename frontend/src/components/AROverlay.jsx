/**
 * AR-style Overlay Component
 * Provides augmented reality-style labels and 3D-like icons over webcam feed
 * Features: Floating labels, CSS 3D transforms, confidence indicators, animation effects
 */

import React, { useState, useEffect, useRef } from 'react'
import { Package, Zap, Target, CheckCircle, AlertTriangle } from 'lucide-react'

const AROverlay = ({ 
    detections = [], 
    canvasSize = { width: 640, height: 480 },
    confidence = 0,
    status = 'scanning' // 'scanning' | 'detected' | 'correct' | 'wrong'
}) => {
    const [animations, setAnimations] = useState({})
    const overlayRef = useRef(null)

    // Update animations when detections change
    useEffect(() => {
        if (detections.length > 0) {
            const newAnimations = {}
            detections.forEach((detection, index) => {
                newAnimations[index] = {
                    scale: 1.1,
                    timestamp: Date.now()
                }
            })
            setAnimations(newAnimations)

            // Reset animations after delay
            setTimeout(() => {
                setAnimations({})
            }, 1000)
        }
    }, [detections])

    // Get 3D icon component for piece type
    const getPieceIcon = (pieceType, size = 24) => {
        const iconStyle = {
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
            transform: 'rotateY(15deg) rotateX(5deg)',
            transformStyle: 'preserve-3d'
        }

        switch (pieceType?.toLowerCase()) {
            case 'head':
                return <div style={{...iconStyle, fontSize: `${size}px`}}>🤖</div>
            case 'body':
                return <div style={{...iconStyle, fontSize: `${size}px`}}>🦴</div>
            case 'arm':
                return <div style={{...iconStyle, fontSize: `${size}px`}}>🦾</div>
            case 'wheel':
                return <div style={{...iconStyle, fontSize: `${size}px`}}>⭕</div>
            case 'accessory':
                return <div style={{...iconStyle, fontSize: `${size}px`}}>🎩</div>
            default:
                return <Package size={size} style={iconStyle} />
        }
    }

    // Calculate position on overlay from bounding box
    const getOverlayPosition = (bbox) => {
        if (!bbox) return { x: 0, y: 0 }
        
        return {
            x: (bbox.x + bbox.width / 2) * canvasSize.width,
            y: bbox.y * canvasSize.height - 20 // Position above bounding box
        }
    }

    // Get confidence color
    const getConfidenceColor = (conf) => {
        if (conf >= 0.8) return '#43e97b'  // Green
        if (conf >= 0.6) return '#ffd93d'  // Yellow
        if (conf >= 0.4) return '#ff9500'  // Orange
        return '#ff6584'  // Red
    }

    // Generate scanning grid overlay
    const ScanningGrid = () => (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            background: `
                linear-gradient(90deg, rgba(67,233,123,0.1) 1px, transparent 1px),
                linear-gradient(rgba(67,233,123,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: status === 'scanning' ? 'grid-scan 3s ease-in-out infinite' : 'none'
        }}>
            {/* Corner brackets */}
            {[
                { top: '10px', left: '10px', borderTop: '3px solid #43e97b', borderLeft: '3px solid #43e97b' },
                { top: '10px', right: '10px', borderTop: '3px solid #43e97b', borderRight: '3px solid #43e97b' },
                { bottom: '10px', left: '10px', borderBottom: '3px solid #43e97b', borderLeft: '3px solid #43e97b' },
                { bottom: '10px', right: '10px', borderBottom: '3px solid #43e97b', borderRight: '3px solid #43e97b' }
            ].map((style, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: '30px',
                    height: '30px',
                    ...style,
                    animation: `corner-glow ${1 + i * 0.2}s ease-in-out infinite alternate`
                }} />
            ))}

            {/* Scanning line */}
            {status === 'scanning' && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '2px',
                    height: '100%',
                    background: 'linear-gradient(to bottom, transparent, #43e97b, transparent)',
                    boxShadow: '0 0 10px #43e97b',
                    animation: 'scan-sweep 2s linear infinite'
                }} />
            )}
        </div>
    )

    // Individual detection label
    const DetectionLabel = ({ detection, index }) => {
        const position = getOverlayPosition(detection.bbox)
        const isAnimating = animations[index]
        const confidenceColor = getConfidenceColor(detection.confidence)

        return (
            <div
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: `translate(-50%, -100%) ${isAnimating ? 'scale(1.1)' : 'scale(1)'}`,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    pointerEvents: 'none',
                    zIndex: 10
                }}
            >
                {/* Main label container */}
                <div style={{
                    background: `linear-gradient(135deg, ${confidenceColor}E6, ${confidenceColor}CC)`,
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${confidenceColor}`,
                    borderRadius: '20px',
                    padding: '12px 20px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '14px',
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    boxShadow: `
                        0 8px 32px rgba(0,0,0,0.3),
                        0 0 0 1px rgba(255,255,255,0.2),
                        inset 0 1px 0 rgba(255,255,255,0.3)
                    `,
                    transform: 'translateZ(0)', // Enable 3D transforms
                    transformStyle: 'preserve-3d',
                    minWidth: '120px'
                }}>
                    {/* 3D Icon */}
                    <div style={{
                        transform: 'rotateY(15deg) rotateX(5deg)',
                        transformStyle: 'preserve-3d',
                        marginBottom: '8px',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                    }}>
                        {getPieceIcon(detection.class_name, 32)}
                    </div>

                    {/* Piece name */}
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {detection.class_name}
                    </div>

                    {/* Confidence bar */}
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        height: '6px',
                        overflow: 'hidden',
                        marginBottom: '4px'
                    }}>
                        <div style={{
                            background: '#ffffff',
                            width: `${detection.confidence * 100}%`,
                            height: '100%',
                            borderRadius: '10px',
                            transition: 'width 0.5s ease'
                        }} />
                    </div>

                    {/* Confidence percentage */}
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        opacity: 0.9
                    }}>
                        {Math.round(detection.confidence * 100)}% confident
                    </div>
                </div>

                {/* Pointing arrow */}
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: `8px solid ${confidenceColor}`,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} />

                {/* Pulse ring animation */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    border: `2px solid ${confidenceColor}`,
                    borderRadius: '20px',
                    animation: 'pulse-ring 2s ease-in-out infinite',
                    pointerEvents: 'none'
                }} />
            </div>
        )
    }

    // Status overlay for different states
    const StatusOverlay = () => {
        if (status === 'scanning') return null

        const getStatusConfig = () => {
            switch (status) {
                case 'detected':
                    return {
                        icon: <Target size={32} />,
                        text: 'Piece Detected!',
                        color: '#6c63ff',
                        animation: 'detected-bounce'
                    }
                case 'correct':
                    return {
                        icon: <CheckCircle size={32} />,
                        text: 'Correct Piece!',
                        color: '#43e97b',
                        animation: 'success-burst'
                    }
                case 'wrong':
                    return {
                        icon: <AlertTriangle size={32} />,
                        text: 'Wrong Piece',
                        color: '#ff6584',
                        animation: 'error-shake'
                    }
                default:
                    return null
            }
        }

        const config = getStatusConfig()
        if (!config) return null

        return (
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: `${config.color}E6`,
                backdropFilter: 'blur(10px)',
                border: `2px solid ${config.color}`,
                borderRadius: '25px',
                padding: '16px 24px',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
                animation: `${config.animation} 0.6s ease-out`,
                zIndex: 15,
                pointerEvents: 'none'
            }}>
                {config.icon}
                {config.text}
            </div>
        )
    }

    return (
        <>
            <div 
                ref={overlayRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 5,
                    overflow: 'hidden'
                }}
            >
                {/* Scanning grid overlay */}
                {status === 'scanning' && <ScanningGrid />}

                {/* Detection labels */}
                {detections.map((detection, index) => (
                    <DetectionLabel 
                        key={`${detection.class_name}-${index}`}
                        detection={detection} 
                        index={index} 
                    />
                ))}

                {/* Status overlay */}
                <StatusOverlay />

                {/* Confidence meter in corner */}
                {detections.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        textAlign: 'center',
                        minWidth: '80px'
                    }}>
                        <Zap size={16} style={{ marginBottom: '4px' }} />
                        <div>Detection</div>
                        <div style={{ color: getConfidenceColor(confidence) }}>
                            {Math.round(confidence * 100)}%
                        </div>
                    </div>
                )}
            </div>

            {/* CSS animations */}
            <style jsx>{`
                @keyframes grid-scan {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                }

                @keyframes corner-glow {
                    0% { opacity: 0.6; box-shadow: 0 0 5px #43e97b; }
                    100% { opacity: 1; box-shadow: 0 0 15px #43e97b; }
                }

                @keyframes scan-sweep {
                    0% { left: -2px; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }

                @keyframes pulse-ring {
                    0% { 
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(1.4);
                        opacity: 0;
                    }
                }

                @keyframes detected-bounce {
                    0% { transform: translateX(-50%) scale(0); }
                    60% { transform: translateX(-50%) scale(1.1); }
                    100% { transform: translateX(-50%) scale(1); }
                }

                @keyframes success-burst {
                    0% { 
                        transform: translateX(-50%) scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.2) rotate(5deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateX(-50%) scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }

                @keyframes error-shake {
                    0%, 100% { transform: translateX(-50%) translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-50%) translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(-50%) translateX(3px); }
                }
            `}</style>
        </>
    )
}

export default AROverlay